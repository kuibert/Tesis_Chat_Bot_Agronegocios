import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { db } from './db';
import { fertilization_plans } from './db/schema';
import { sql, ilike, eq, and, asc } from 'drizzle-orm';
import { embeddingService } from './services/embeddingService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =============================================================================
// SESIONES EN MEMORIA — solo guarda el cultivo detectado para contexto
// =============================================================================
interface Session { cultivo?: string; lastUpdated: number; }
const sessions = new Map<string, Session>();
setInterval(() => {
    const now = Date.now();
    sessions.forEach((s, id) => { if (now - s.lastUpdated > 30 * 60 * 1000) sessions.delete(id); });
}, 30 * 60 * 1000);

// =============================================================================
// CULTIVOS CONOCIDOS — para extracción de entidades
// =============================================================================
const CULTIVOS_CONOCIDOS = [
    'aguacate', 'apio', 'bangaña', 'berengena', 'brocoli', 'brócoli',
    'cafe', 'café', 'calabacita', 'calabaza', 'camote', 'cantaloup', 'melon', 'melón',
    'cebolla', 'chile', 'jalapeño', 'clavel', 'coliflor', 'cunde',
    'fresa', 'frijol', 'guayaba', 'habichuela', 'lechuga', 'loroco',
    'maiz', 'maíz', 'maiz dulce', 'maíz dulce', 'malanga', 'maracuya', 'maracuyá',
    'okra', 'papa', 'papas', 'pasto', 'pataste', 'chayote', 'pepino',
    'platano', 'plátano', 'piña', 'remolacha', 'repollo', 'sandia', 'sandía',
    'tabaco', 'tomate', 'yuca', 'zanahoria', 'chive', 'zucchini', 'crisantemos', 'calaguala'
];

function normalizeText(t: string): string {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractCultivo(text: string): string | undefined {
    const norm = normalizeText(text);
    // Buscar por orden de longitud (primero los más específicos)
    const sorted = [...CULTIVOS_CONOCIDOS].sort((a, b) => b.length - a.length);
    for (const c of sorted) {
        if (norm.includes(normalizeText(c))) return c;
    }
    return undefined;
}

// =============================================================================
// FUNCIÓN: Construir respuesta amigable — diferencia registros generales, semanales y de suelo
// =============================================================================
function buildResponse(plan: any, similitud: number, cultivoBuscado?: string, esSuelo: boolean = false): string {
    const tipoRegistro = plan.tipo_registro || 'general';

    // ── Registro SEMANAL ──────────────────────────────────────────────────────
    if (tipoRegistro === 'semanal' && plan.semana) {
        const semana = plan.semana;
        const ddtInicio = plan.ddt_inicio ?? '?';
        const ddtFin = plan.ddt_fin ?? '?';
        let resp = `✅ Dosificación de **Semana ${semana}** (días ${ddtInicio}-${ddtFin}) para **${plan.cultivo}**${plan.variedad ? ` (${plan.variedad})` : ''} en **${plan.zona}**:\n\n`;

        if (plan.dosis_urea_lbs && plan.dosis_urea_lbs > 0)
            resp += `🌱 **Urea:** ${Number(plan.dosis_urea_lbs).toFixed(2)} lbs/ha\n`;
        if (plan.dosis_fosforo_lbs && plan.dosis_fosforo_lbs > 0)
            resp += `🌱 **${plan.fosforo_nombre || 'Fertilizante Fósforo'}:** ${Number(plan.dosis_fosforo_lbs).toFixed(2)} lbs/ha\n`;
        if (plan.dosis_potasio_lbs && plan.dosis_potasio_lbs > 0)
            resp += `🌱 **${plan.fuente_potasio || 'Kcl'}:** ${Number(plan.dosis_potasio_lbs).toFixed(2)} lbs/ha\n`;
        if (plan.dosis_magnesio_lbs && plan.dosis_magnesio_lbs > 0)
            resp += `🌱 **${plan.magnesio_nombre || 'Sulfato Magnesio'}:** ${Number(plan.dosis_magnesio_lbs).toFixed(2)} lbs/ha\n`;
        if (plan.dosis_calcio_lbs && plan.dosis_calcio_lbs > 0)
            resp += `🌱 **${plan.calcio_nombre || 'Nitrato Calcio'}:** ${Number(plan.dosis_calcio_lbs).toFixed(2)} lbs/ha\n`;
        if (plan.dosis_boro_g && plan.dosis_boro_g > 0)
            resp += `🌱 **${plan.boro_nombre || 'Solubor'}:** ${Number(plan.dosis_boro_g).toFixed(2)} g/ha\n`;

        resp += `\n---\n⚠️ Dosis por hectárea basadas en calendarios MCA-EDA Honduras. Ajustá según el área de tu finca.\n\n🌱 ¿Querés la dosis de otra semana o consultar otro cultivo?`;
        return resp;
    }

    // ── Registro con ANÁLISIS DE SUELO ────────────────────────────────────────
    const tieneSuelo = plan.suelo_p_ppm !== null && plan.suelo_p_ppm !== undefined;
    if (tieneSuelo && esSuelo) {
        let resp = `✅ Análisis de suelo registrado para **${plan.cultivo}**${plan.variedad ? ` (${plan.variedad})` : ''} en **${plan.zona}**:\n\n`;
        resp += `| Elemento | Resultado | Estatus |\n|---------|-----------|---------|\n`;
        if (plan.suelo_p_ppm !== null) resp += `| Fósforo (P) | ${plan.suelo_p_ppm} ppm | ${plan.suelo_estatus || 'Muy Bajo'} |\n`;
        if (plan.suelo_k_ppm !== null) resp += `| Potasio (K) | ${plan.suelo_k_ppm} ppm | ${plan.suelo_estatus || 'Muy Bajo'} |\n`;
        if (plan.suelo_mg_ppm !== null) resp += `| Magnesio (Mg) | ${plan.suelo_mg_ppm} ppm | ${plan.suelo_estatus || 'Muy Bajo'} |\n`;
        if (plan.suelo_ca_ppm !== null) resp += `| Calcio (Ca) | ${plan.suelo_ca_ppm} ppm | ${plan.suelo_estatus || 'Muy Bajo'} |\n`;
        resp += `\n**¿Qué significa esto?**\n`;
        resp += `Los valores _ppm_ (partes por millón) indican la concentración del nutriente en el suelo. `;
        resp += `El estatus _"Muy Bajo"_ significa que se recomienda aplicar el 100% de la dosis de fertilizante.\n\n`;
        resp += `---\n⚠️ Datos del método Mehlich-1 (doble ácido). Realizá un análisis actual de tu suelo para mayor precisión.\n\n🌱 ¿Querés saber la recomendación de fertilizante para este cultivo?`;
        return resp;
    }

    // ── Registro GENERAL (continúa abajo) ────────────────────────────────────
    const npkParts = String(plan.formula_npk || '').split('-');
    let npkExplicado = `**${plan.formula_npk}**`;
    if (npkParts.length >= 3) {
        npkExplicado = `**${plan.formula_npk}**\n   _(Nitrógeno: ${npkParts[0]}% · Fósforo: ${npkParts[1]}% · Potasio: ${npkParts[2].replace(',', '')}%)_`;
    }

    // Si el cultivo buscado coincide con el resultado → ALTA confianza
    // Si no coincide → usar el score como respaldo
    const nombreResultado = normalizeText(plan.cultivo || '');
    const nombreBuscado = normalizeText(cultivoBuscado || '');
    const nombreCoincide = nombreBuscado.length > 0 && nombreResultado.includes(nombreBuscado.split(' ')[0]);
    const confianza = nombreCoincide ? 'alta' : similitud >= 0.45 ? 'media' : 'baja';

    let header = '';
    if (confianza === 'alta') {
        header = `✅ Aquí tenés la recomendación de fertilización para **${plan.cultivo}**${plan.variedad ? ` variedad **${plan.variedad}**` : ''} en la zona de **${plan.zona}**:\n\n`;
    } else if (confianza === 'media') {
        header = `🔍 El resultado más cercano es para **${plan.cultivo}**${plan.variedad ? ` (${plan.variedad})` : ''} en **${plan.zona}**. Puede que no sea exacto para lo que buscás:\n\n`;
    } else {
        header = `⚠️ No encontré datos exactos, pero lo más parecido es **${plan.cultivo}** en **${plan.zona}**. Tomalo solo como referencia:\n\n`;
    }

    let body = header;

    if (plan.dias_cosecha && plan.dias_cosecha > 0) {
        body += `📅 **Ciclo del cultivo:** ${plan.dias_cosecha} días hasta la cosecha\n\n`;
    }

    body += `💊 **Fertilizante recomendado:** ${npkExplicado}\n\n`;

    if (plan.fuente_potasio && plan.fuente_potasio !== 'Ver calendario') {
        body += `🧪 **Fuente de Potasio:** ${plan.fuente_potasio}\n\n`;
    }

    const obs = String(plan.observaciones_tecnicas || '');
    const nitroMatch = obs.match(/Fuente de Nitrógeno[:\s]+([^.]+)/i);
    if (nitroMatch) {
        body += `🧪 **Fuente de Nitrógeno:** ${nitroMatch[1].trim()}\n\n`;
    }

    // Agregar preventivos si existen
    const preventivosList: string[] = [];
    if (plan.preventivo_insecticida) preventivosList.push(`🐛 **Insecticida:** ${plan.preventivo_insecticida}`);
    if (plan.preventivo_fungicida) preventivosList.push(`🍄 **Fungicida:** ${plan.preventivo_fungicida}`);
    if (plan.preventivo_nematicida) preventivosList.push(`🪱 **Nematicida:** ${plan.preventivo_nematicida}`);
    if (plan.preventivo_activador) preventivosList.push(`🛡️ **Activador de Defensas:** ${plan.preventivo_activador}`);

    if (preventivosList.length > 0) {
        body += `🛡️ **Tratamientos Preventivos sugeridos:**\n`;
        body += preventivosList.map(p => `   • ${p}`).join('\n') + `\n\n`;
    }

    body += `---\n`;

    if (confianza === 'baja') {
        body += `💡 Para una recomendación más precisa, intentá escribir el nombre exacto del cultivo y tu zona. `;
        body += `Por ejemplo: *"fertilización para tomate en Cantarranas"*.\n\n`;
    }

    body += `⚠️ Esta información viene de calendarios históricos de Honduras (MCA-EDA). Consultá con un técnico agrícola para ajustarla a tu finca.\n\n`;
    body += `🌱 ¿Tenés otra consulta o querés saber más sobre este cultivo?`;

    return body;
}

// =============================================================================
// ENDPOINT PRINCIPAL — Flujo simplificado
// =============================================================================
app.post('/api/chat', async (req, res) => {
    const { question, sessionId } = req.body;
    const startTime = Date.now();

    if (!question?.trim()) {
        return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    // Obtener sesión
    const sid = sessionId || 'default';
    if (!sessions.has(sid)) sessions.set(sid, { lastUpdated: Date.now() });
    const session = sessions.get(sid)!;
    session.lastUpdated = Date.now();

    // PASO 1 — Detectar saludo / mensaje inicial
    const normQuestion = normalizeText(question);
    const isSaludo = /^(hola|buenas|buenos dias|buenas tardes|hi|hey|saludos|buen dia|inicio|empezar)/.test(normQuestion) && normQuestion.length < 25;
    if (isSaludo) {
        return res.json({
            answer: `¡Hola! 👋 Soy **AgroChat**, tu asistente de fertilización agrícola.\n\nEstoy aquí para ayudarte con recomendaciones basadas en calendarios históricos de cultivos hondureños 🇭🇳.\n\n¿Sobre qué cultivo querés consultar? Por ejemplo: *"¿Cómo fertilizo tomate?"* o simplemente escribí el nombre del cultivo.`,
            sources: [],
            metadata: { processed_time_ms: Date.now() - startTime }
        });
    }

    // PASO 2 — Extraer cultivo del mensaje actual
    const cultivoDetectado = extractCultivo(question);
    if (cultivoDetectado) session.cultivo = cultivoDetectado;

    // PASO 3 — Si no hay cultivo ni en el mensaje ni en el historial → UNA sola pregunta
    if (!session.cultivo) {
        return res.json({
            answer: `Entendí tu pregunta, pero necesito saber **¿sobre qué cultivo** querés consultar? 🌿\n\nTenemos datos de: tomate, maíz, papa, café, aguacate, platano, repollo, pepino, cebolla, frijol, zanahoria, y muchos más.\n\n¡Escribí el nombre del cultivo y te ayudo de inmediato!`,
            sources: [],
            metadata: { processed_time_ms: Date.now() - startTime }
        });
    }

    // PASO 4 — Detectar tipo de consulta y buscar con el contexto adecuado
    try {
        const normQ = normalizeText(question);
        const esSemanal = /semana|semanas|semana \d|dosis\s+semana|aplicacion semana/.test(normQ);
        const esSuelo = /suelo|analisis|fosforo suelo|potasio suelo|magnesio suelo|calcio suelo|ppm|nutriente/.test(normQ);

        // Construir texto de búsqueda enriquecido
        let searchText = `fertilización ${session.cultivo} Honduras ${question}`;
        if (esSemanal) {
            // Extraer número de semana si se menciona
            const semMatch = normQ.match(/(semana|sem)\s*(\d+)/);
            const numSem = semMatch ? semMatch[2] : '';
            searchText = `Semana ${numSem} ${session.cultivo} dosificación lbs aplicacion`;
        } else if (esSuelo) {
            searchText = `analisis suelo ${session.cultivo} fosforo potasio magnesio calcio ppm`;
        }

        const { pgVector } = await embeddingService.generateEmbedding(searchText);

        // OBTENER LA PRIMERA PALABRA EN MINÚSCULAS para usar con ILIKE (funciona mejor con la palabra original resguardada)
        const primerPalabraCultivo = session.cultivo.split(' ')[0].toLowerCase();
        const palabraNormalizada = normalizeText(primerPalabraCultivo);

        const primerPalabraCultivoLike = `%${primerPalabraCultivo}%`;
        const palabraNormalizadaLike = `%${palabraNormalizada}%`;

        // Filtro por tipo de registro según la intención de la pregunta
        let matchedPlans: any[];
        if (esSemanal) {
            // Extraer el número explícito de semana si lo hay
            const semMatch = normQ.match(/(semana|sem)\s*(\d+)/);
            const numeroSemana = semMatch ? parseInt(semMatch[2], 10) : null;

            if (numeroSemana) {
                const distance = sql`embedding <=> ${pgVector}::vector`;
                matchedPlans = await db.select({
                    cultivo: fertilization_plans.cultivo, variedad: fertilization_plans.variedad, zona: fertilization_plans.zona, dias_cosecha: fertilization_plans.dias_cosecha, formula_npk: fertilization_plans.formula_npk,
                    fosforo_nombre: fertilization_plans.fosforo_nombre, fuente_potasio: fertilization_plans.fuente_potasio, nitrogeno_nombre: fertilization_plans.nitrogeno_nombre, magnesio_nombre: fertilization_plans.magnesio_nombre, calcio_nombre: fertilization_plans.calcio_nombre, boro_nombre: fertilization_plans.boro_nombre,
                    semana: fertilization_plans.semana, ddt_inicio: fertilization_plans.ddt_inicio, ddt_fin: fertilization_plans.ddt_fin,
                    dosis_urea_lbs: fertilization_plans.dosis_urea_lbs, dosis_fosforo_lbs: fertilization_plans.dosis_fosforo_lbs, dosis_potasio_lbs: fertilization_plans.dosis_potasio_lbs,
                    dosis_magnesio_lbs: fertilization_plans.dosis_magnesio_lbs, dosis_calcio_lbs: fertilization_plans.dosis_calcio_lbs, dosis_boro_g: fertilization_plans.dosis_boro_g,
                    observaciones_tecnicas: fertilization_plans.observaciones_tecnicas, tipo_registro: fertilization_plans.tipo_registro,
                    similitud: sql<number>`ROUND(CAST(1 - (${distance}) AS numeric), 3)`
                })
                    .from(fertilization_plans)
                    .where(
                        and(
                            eq(fertilization_plans.tipo_registro, 'semanal'),
                            eq(fertilization_plans.semana, numeroSemana),
                            ilike(fertilization_plans.cultivo, primerPalabraCultivoLike),
                            sql`embedding IS NOT NULL`
                        )
                    )
                    .orderBy(asc(distance))
                    .limit(3);

            } else {
                const distance = sql`embedding <=> ${pgVector}::vector`;
                matchedPlans = await db.select({
                    cultivo: fertilization_plans.cultivo, variedad: fertilization_plans.variedad, zona: fertilization_plans.zona, dias_cosecha: fertilization_plans.dias_cosecha, formula_npk: fertilization_plans.formula_npk,
                    fosforo_nombre: fertilization_plans.fosforo_nombre, fuente_potasio: fertilization_plans.fuente_potasio, nitrogeno_nombre: fertilization_plans.nitrogeno_nombre, magnesio_nombre: fertilization_plans.magnesio_nombre, calcio_nombre: fertilization_plans.calcio_nombre, boro_nombre: fertilization_plans.boro_nombre,
                    semana: fertilization_plans.semana, ddt_inicio: fertilization_plans.ddt_inicio, ddt_fin: fertilization_plans.ddt_fin,
                    dosis_urea_lbs: fertilization_plans.dosis_urea_lbs, dosis_fosforo_lbs: fertilization_plans.dosis_fosforo_lbs, dosis_potasio_lbs: fertilization_plans.dosis_potasio_lbs,
                    dosis_magnesio_lbs: fertilization_plans.dosis_magnesio_lbs, dosis_calcio_lbs: fertilization_plans.dosis_calcio_lbs, dosis_boro_g: fertilization_plans.dosis_boro_g,
                    observaciones_tecnicas: fertilization_plans.observaciones_tecnicas, tipo_registro: fertilization_plans.tipo_registro,
                    similitud: sql<number>`ROUND(CAST(1 - (${distance}) AS numeric), 3)`
                })
                    .from(fertilization_plans)
                    .where(
                        and(
                            eq(fertilization_plans.tipo_registro, 'semanal'),
                            ilike(fertilization_plans.cultivo, primerPalabraCultivoLike),
                            sql`embedding IS NOT NULL`
                        )
                    )
                    .orderBy(asc(distance))
                    .limit(3);
            }
        } else {
            const distance = sql`embedding <=> ${pgVector}::vector`;
            matchedPlans = await db.select({
                cultivo: fertilization_plans.cultivo, variedad: fertilization_plans.variedad, zona: fertilization_plans.zona, dias_cosecha: fertilization_plans.dias_cosecha, formula_npk: fertilization_plans.formula_npk,
                fosforo_nombre: fertilization_plans.fosforo_nombre, fuente_potasio: fertilization_plans.fuente_potasio, nitrogeno_nombre: fertilization_plans.nitrogeno_nombre, magnesio_nombre: fertilization_plans.magnesio_nombre, calcio_nombre: fertilization_plans.calcio_nombre, boro_nombre: fertilization_plans.boro_nombre,
                suelo_p_ppm: fertilization_plans.suelo_p_ppm, suelo_k_ppm: fertilization_plans.suelo_k_ppm, suelo_mg_ppm: fertilization_plans.suelo_mg_ppm, suelo_ca_ppm: fertilization_plans.suelo_ca_ppm, suelo_estatus: fertilization_plans.suelo_estatus,
                semana: fertilization_plans.semana, ddt_inicio: fertilization_plans.ddt_inicio, ddt_fin: fertilization_plans.ddt_fin,
                dosis_urea_lbs: fertilization_plans.dosis_urea_lbs, dosis_fosforo_lbs: fertilization_plans.dosis_fosforo_lbs, dosis_potasio_lbs: fertilization_plans.dosis_potasio_lbs,
                dosis_magnesio_lbs: fertilization_plans.dosis_magnesio_lbs, dosis_calcio_lbs: fertilization_plans.dosis_calcio_lbs, dosis_boro_g: fertilization_plans.dosis_boro_g,
                preventivo_insecticida: fertilization_plans.preventivo_insecticida, preventivo_fungicida: fertilization_plans.preventivo_fungicida, preventivo_nematicida: fertilization_plans.preventivo_nematicida, preventivo_activador: fertilization_plans.preventivo_activador,
                observaciones_tecnicas: fertilization_plans.observaciones_tecnicas, tipo_registro: fertilization_plans.tipo_registro,
                similitud: sql<number>`ROUND(CAST(1 - (${distance}) AS numeric), 3)`
            })
                .from(fertilization_plans)
                .where(
                    and(
                        eq(fertilization_plans.tipo_registro, 'general'),
                        ilike(fertilization_plans.cultivo, primerPalabraCultivoLike),
                        sql`embedding IS NOT NULL`
                    )
                )
                .orderBy(asc(distance))
                .limit(3);
        }

        // PASO 5 — Sin resultados
        if (matchedPlans.length === 0 || !matchedPlans[0]) {
            const cultivoQueFallo = session.cultivo || '';
            session.cultivo = undefined; // resetear para próxima pregunta
            return res.json({
                answer: `😕 No encontré registros históricos de fertilización para **${cultivoQueFallo}** en nuestra base de datos.\n\nTenemos datos de: tomate, maíz, papa, café, aguacate, platano, repollo, pepino, cebolla, frijol, zanahoria, sandia, pepino, lechuga y más.\n\n¿Querés consultar sobre alguno de esos cultivos?`,
                sources: [],
                metadata: { processed_time_ms: Date.now() - startTime }
            });
        }

        // PASO 6 — Respuesta según nivel de confianza (score de similitud)
        const bestMatch = matchedPlans[0];
        const similitud = parseFloat(bestMatch.similitud) || 0;
        const answer = buildResponse(bestMatch, similitud, session.cultivo, esSuelo);

        res.json({
            answer,
            sources: matchedPlans,
            metadata: { processed_time_ms: Date.now() - startTime }
        });

    } catch (error) {
        console.error('Error en /api/chat:', error);
        res.status(500).json({ error: 'Error procesando la consulta agrícola' });
    }
});

// =============================================================================
// Resetear sesión al hacer "Nuevo Chat"
// =============================================================================
app.post('/api/session/reset', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) sessions.delete(sessionId);
    res.json({ ok: true });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'AgroChat Backend', sessions: sessions.size });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de AgroChat corriendo en http://localhost:${PORT}`);
});
