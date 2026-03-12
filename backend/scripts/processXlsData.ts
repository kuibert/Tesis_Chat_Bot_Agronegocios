import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { db } from '../src/db';
import { fertilization_plans } from '../src/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fertilization_db',
};

const DATA_DIR = path.join(__dirname, '../../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion');

// =================== UTILIDADES ===================

function getCell(rows: any[][], rowIdx: number, colIdx: number): any {
    return rows[rowIdx]?.[colIdx] ?? null;
}

function str(val: any): string {
    return val !== null && val !== undefined ? String(val).trim() : '';
}

function num(val: any): number | null {
    const n = parseFloat(String(val));
    return isNaN(n) ? null : n;
}

// =================== EXTRACCIÓN HOJA MAIN ===================

interface MainData {
    cultivo: string;
    variedad: string;
    zona: string;
    dias_cosecha: number;
    // 6 fertilizantes
    formula_npk: string;
    fosforo_formula: string;
    fosforo_nombre: string;
    potasio_formula: string;
    fuente_potasio: string;
    nitrogeno_formula: string;
    nitrogeno_nombre: string;
    magnesio_nombre: string;
    calcio_nombre: string;
    boro_nombre: string;
    materia_organica: string;
    // Análisis de suelo
    suelo_p_ppm: number | null;
    suelo_k_ppm: number | null;
    suelo_mg_ppm: number | null;
    suelo_ca_ppm: number | null;
    suelo_estatus: string;
    // Preventivos
    preventivo_insecticida: string;
    preventivo_fungicida: string;
    preventivo_nematicida: string;
    preventivo_activador: string;
    // Texto enriquecido para embedding
    observaciones_tecnicas: string;
}

function extractMainSheet(rows: any[][], fileName: string): MainData {
    const cultivoFromFile = fileName.split('_')[0];

    const cultivo = str(getCell(rows, 20, 4)) || cultivoFromFile;
    const variedad = str(getCell(rows, 20, 6));
    const zona = str(getCell(rows, 17, 4)) || 'Honduras (General)';
    const dias_cosecha = num(getCell(rows, 23, 4)) || 0;

    // 6 fertilizantes
    const fosforo_formula = str(getCell(rows, 30, 3));
    const fosforo_nombre = str(getCell(rows, 31, 3));
    const potasio_formula = str(getCell(rows, 35, 3));
    const fuente_potasio = str(getCell(rows, 36, 3));
    const nitrogeno_formula = str(getCell(rows, 40, 3));
    const nitrogeno_nombre = str(getCell(rows, 41, 3));
    const magnesio_nombre = str(getCell(rows, 46, 3));
    const calcio_nombre = str(getCell(rows, 51, 3));
    const boro_nombre = str(getCell(rows, 56, 3));
    const materia_organica = str(getCell(rows, 60, 3));

    // Análisis de suelo
    const suelo_p_ppm = num(getCell(rows, 71, 3));
    const suelo_p_estatus = str(getCell(rows, 71, 4));
    const suelo_k_ppm = num(getCell(rows, 72, 3));
    const suelo_mg_ppm = num(getCell(rows, 73, 3));
    const suelo_ca_ppm = num(getCell(rows, 74, 3));
    const suelo_estatus = suelo_p_estatus || 'No especificado';

    // Preventivos (Ubicados aprox entre fila 80-85, columna H = índice 7 y dosis en las cols 10 y 12)
    // Buscamos dinámicamente según el texto de la columna C (índice 2)
    let preventivo_insecticida = '';
    let preventivo_nematicida = '';
    let preventivo_fungicida = '';
    let preventivo_activador = '';

    for (let i = 75; i <= 90; i++) {
        const item = str(getCell(rows, i, 2)).toLowerCase();
        const prod = str(getCell(rows, i, 7));
        const dosis = num(getCell(rows, i, 10));
        const unid = str(getCell(rows, i, 12));

        if (prod && item) {
            const desc = `${prod}${dosis ? ` (${dosis} ${unid})` : ''}`;
            if (item.includes('insecticida inmediatamente') || item.includes('insecticida para')) {
                preventivo_insecticida = preventivo_insecticida ? `${preventivo_insecticida}, ${desc}` : desc;
            } else if (item.includes('nemat')) {
                preventivo_nematicida = desc;
            } else if (item.includes('fungicida') || item.includes('oomicetos') || item.includes('enfermedades de suelo')) {
                preventivo_fungicida = preventivo_fungicida ? `${preventivo_fungicida}, ${desc}` : desc;
            } else if (item.includes('activador')) {
                preventivo_activador = preventivo_activador ? `${preventivo_activador}, ${desc}` : desc;
            } else if (item.includes('insectos de suelo')) {
                preventivo_insecticida = preventivo_insecticida ? `${preventivo_insecticida}, ${desc}` : desc;
            }
        }
    }

    // Construir texto de observaciones rico (para embedding)
    const parts: string[] = [];
    if (fosforo_nombre) parts.push(`Fósforo: ${fosforo_nombre} (${fosforo_formula})`);
    if (nitrogeno_nombre) parts.push(`Nitrógeno: ${nitrogeno_nombre} (${nitrogeno_formula})`);
    if (fuente_potasio) parts.push(`Potasio: ${fuente_potasio} (${potasio_formula})`);
    if (magnesio_nombre) parts.push(`Magnesio: ${magnesio_nombre}`);
    if (calcio_nombre && calcio_nombre !== 'Sin Calcio') parts.push(`Calcio: ${calcio_nombre}`);
    if (boro_nombre) parts.push(`Boro: ${boro_nombre}`);
    if (materia_organica) parts.push(`Materia Orgánica: ${materia_organica}`);
    if (suelo_p_ppm !== null) parts.push(`Suelo P: ${suelo_p_ppm} ppm (${suelo_estatus})`);
    if (suelo_k_ppm !== null) parts.push(`Suelo K: ${suelo_k_ppm} ppm`);

    const prevs: string[] = [];
    if (preventivo_insecticida) prevs.push(`Insecticida: ${preventivo_insecticida}`);
    if (preventivo_fungicida) prevs.push(`Fungicida: ${preventivo_fungicida}`);
    if (preventivo_nematicida) prevs.push(`Nematicida: ${preventivo_nematicida}`);
    if (preventivo_activador) prevs.push(`Activador: ${preventivo_activador}`);
    if (prevs.length > 0) parts.push(`Preventivos Recomendados: ${prevs.join(', ')}`);
    if (suelo_mg_ppm !== null) parts.push(`Suelo Mg: ${suelo_mg_ppm} ppm`);
    if (suelo_ca_ppm !== null) parts.push(`Suelo Ca: ${suelo_ca_ppm} ppm`);

    const observaciones_tecnicas = parts.join('. ') || 'Calendario de fertilización histórico de Honduras.';

    return {
        cultivo, variedad, zona, dias_cosecha,
        formula_npk: fosforo_formula,
        fosforo_formula, fosforo_nombre, potasio_formula, fuente_potasio,
        nitrogeno_formula, nitrogeno_nombre, magnesio_nombre, calcio_nombre,
        boro_nombre, materia_organica,
        suelo_p_ppm, suelo_k_ppm, suelo_mg_ppm, suelo_ca_ppm, suelo_estatus,
        preventivo_insecticida, preventivo_fungicida, preventivo_nematicida, preventivo_activador,
        observaciones_tecnicas
    };
}

// =================== EXTRACCIÓN CALENDARIOS SEMANALES ===================

interface WeeklyRecord {
    semana: number;
    ddt_inicio: number;
    ddt_fin: number;
    dosis_urea_lbs: number | null;
    dosis_fosforo_lbs: number | null;
    dosis_potasio_lbs: number | null;
    dosis_magnesio_lbs: number | null;
    dosis_calcio_lbs: number | null;
    dosis_boro_g: number | null;
    observaciones_tecnicas: string;
}

function extractWeeklySheet(wb: XLSX.WorkBook, mainData: MainData): WeeklyRecord[] {
    // Buscamos la hoja "2 Por Sem" o "14 Dias" o la primera hoja de calendario disponible
    const calendarSheets = ['2 Por Sem', '1 Por Sem', '14 Dias', 'Cal-Diario'];
    let ws: XLSX.WorkSheet | null = null;
    for (const name of calendarSheets) {
        if (wb.SheetNames.includes(name)) {
            ws = wb.Sheets[name];
            break;
        }
    }
    if (!ws) return [];

    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Encontrar la fila de encabezado buscando la columna "DDT"
    let headerRow = -1;
    for (let i = 0; i < Math.min(rows.length, 25); i++) {
        if (rows[i]?.some((c: any) => String(c).includes('DDT'))) {
            headerRow = i;
            break;
        }
    }
    if (headerRow === -1) return [];

    // Mapear columnas por encabezado
    const header = rows[headerRow];
    const colSemana = header.findIndex((c: any) => String(c || '').toLowerCase().includes('semana'));
    const colDDT = header.findIndex((c: any) => String(c || '').toUpperCase() === 'DDT');

    // Para las dosificaciones buscamos por nombre del fertilizante en el header
    const colUrea = header.findIndex((c: any) => String(c || '').toLowerCase().includes('urea'));
    const colDap = header.findIndex((c: any) => {
        const s = String(c || '').toLowerCase();
        return s.includes('dap') || s.includes('fosforo') || s.includes('fósforo') || s.includes('18-46') || s.includes('mono');
    });
    const colKcl = header.findIndex((c: any) => {
        const s = String(c || '').toLowerCase();
        return s.includes('kcl') || s.includes('potasio') || s.includes('0-0-60');
    });
    const colMg = header.findIndex((c: any) => {
        const s = String(c || '').toLowerCase();
        return s.includes('magnesio') || s.includes('sulfato');
    });
    const colCa = header.findIndex((c: any) => {
        const s = String(c || '').toLowerCase();
        return s.includes('calcio') || s.includes('nitrato de c');
    });
    const colBoro = header.findIndex((c: any) => {
        const s = String(c || '').toLowerCase();
        return s.includes('boro') || s.includes('solubor');
    });

    const records: WeeklyRecord[] = [];
    let currentSemana = 0;
    let ddtInicio = 0;

    for (let i = headerRow + 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every((c: any) => c === null || c === undefined)) continue;

        // Detectar cambio de semana
        const semanaVal = num(row[colSemana]);
        const ddtVal = num(colDDT >= 0 ? row[colDDT] : null);

        if (semanaVal !== null && semanaVal > 0) {
            // Si hay una semana previa guardada, cerrarla
            if (currentSemana > 0 && ddtVal !== null) {
                // Guardar el registro de la semana anterior si tiene dosis
                const lastRecord = records[records.length - 1];
                if (lastRecord && lastRecord.semana === currentSemana) {
                    lastRecord.ddt_fin = ddtVal - 1;
                }
            }
            currentSemana = semanaVal;
            ddtInicio = ddtVal ?? 0;

            // Extraer dosis de esta semana
            const urea = num(colUrea >= 0 ? row[colUrea] : null);
            const fosforo = num(colDap >= 0 ? row[colDap] : null);
            const potasio = num(colKcl >= 0 ? row[colKcl] : null);
            const magnesio = num(colMg >= 0 ? row[colMg] : null);
            const calcio = num(colCa >= 0 ? row[colCa] : null);
            const boro = num(colBoro >= 0 ? row[colBoro] : null);

            // Solo guardar si hay al menos una dosis > 0
            const hasDoses = [urea, fosforo, potasio, magnesio, calcio, boro].some(v => v !== null && v > 0);
            if (!hasDoses) continue;

            // Construir observaciones ricas para el embedding
            const dosisParts: string[] = [];
            if (urea) dosisParts.push(`Urea ${urea.toFixed(2)} lbs`);
            if (fosforo) dosisParts.push(`${mainData.fosforo_nombre || 'DAP'} ${fosforo.toFixed(2)} lbs`);
            if (potasio) dosisParts.push(`${mainData.fuente_potasio || 'Kcl'} ${potasio.toFixed(2)} lbs`);
            if (magnesio) dosisParts.push(`${mainData.magnesio_nombre || 'Sulfato Mg'} ${magnesio.toFixed(2)} lbs`);
            if (calcio) dosisParts.push(`${mainData.calcio_nombre || 'Nitrato Ca'} ${calcio.toFixed(2)} lbs`);
            if (boro) dosisParts.push(`${mainData.boro_nombre || 'Solubor'} ${boro.toFixed(2)} g`);

            const obs = `Semana ${currentSemana} (día ${ddtInicio}) — ${mainData.cultivo} ${mainData.variedad} en ${mainData.zona}. Dosificación: ${dosisParts.join(', ')}.`;

            records.push({
                semana: currentSemana,
                ddt_inicio: ddtInicio,
                ddt_fin: ddtInicio + 6, // estimado, se actualiza cuando llega la siguiente semana
                dosis_urea_lbs: urea,
                dosis_fosforo_lbs: fosforo,
                dosis_potasio_lbs: potasio,
                dosis_magnesio_lbs: magnesio,
                dosis_calcio_lbs: calcio,
                dosis_boro_g: boro,
                observaciones_tecnicas: obs
            });
        }
    }

    return records;
}

// =================== MAIN ===================

async function processXLSFiles() {
    console.log('🚀 Iniciando extracción COMPLETA de datos XLS...\n');

    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Carpeta no encontrada: ${DATA_DIR}`);
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.xls'));
    console.log(`📂 Encontrados ${files.length} archivos XLS\n`);

    try {
        // Limpiar tabla usando Drizzle
        await db.delete(fertilization_plans);
        console.log('🗑️  Datos anteriores eliminados.\n');

        let totalGeneral = 0;
        let totalSemanal = 0;
        let errores = 0;

        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            try {
                const wb = XLSX.readFile(filePath);
                const mainWs = wb.Sheets[wb.SheetNames[0]];
                const mainRows: any[][] = XLSX.utils.sheet_to_json(mainWs, { header: 1 });

                const m = extractMainSheet(mainRows, file);

                // ── Insertar registro GENERAL ──
                await db.insert(fertilization_plans).values({
                    cultivo: m.cultivo, variedad: m.variedad, zona: m.zona, dias_cosecha: m.dias_cosecha,
                    formula_npk: m.formula_npk, fosforo_nombre: m.fosforo_nombre,
                    fuente_potasio: m.fuente_potasio, nitrogeno_nombre: m.nitrogeno_nombre,
                    magnesio_nombre: m.magnesio_nombre, calcio_nombre: m.calcio_nombre, boro_nombre: m.boro_nombre,
                    suelo_p_ppm: m.suelo_p_ppm !== null ? String(m.suelo_p_ppm) : null,
                    suelo_k_ppm: m.suelo_k_ppm !== null ? String(m.suelo_k_ppm) : null,
                    suelo_mg_ppm: m.suelo_mg_ppm !== null ? String(m.suelo_mg_ppm) : null,
                    suelo_ca_ppm: m.suelo_ca_ppm !== null ? String(m.suelo_ca_ppm) : null,
                    suelo_estatus: m.suelo_estatus,
                    preventivo_insecticida: m.preventivo_insecticida, preventivo_fungicida: m.preventivo_fungicida,
                    preventivo_nematicida: m.preventivo_nematicida, preventivo_activador: m.preventivo_activador,
                    observaciones_tecnicas: m.observaciones_tecnicas,
                    tipo_registro: 'general'
                });
                totalGeneral++;

                // ── Insertar registros SEMANALES ──
                const weeks = extractWeeklySheet(wb, m);

                if (weeks.length > 0) {
                    const insertValues = weeks.map(w => ({
                        cultivo: m.cultivo, variedad: m.variedad, zona: m.zona, dias_cosecha: m.dias_cosecha,
                        formula_npk: m.formula_npk, fuente_potasio: m.fuente_potasio,
                        nitrogeno_nombre: m.nitrogeno_nombre, magnesio_nombre: m.magnesio_nombre,
                        semana: w.semana, ddt_inicio: w.ddt_inicio, ddt_fin: w.ddt_fin,
                        dosis_urea_lbs: w.dosis_urea_lbs !== null ? String(w.dosis_urea_lbs) : null,
                        dosis_fosforo_lbs: w.dosis_fosforo_lbs !== null ? String(w.dosis_fosforo_lbs) : null,
                        dosis_potasio_lbs: w.dosis_potasio_lbs !== null ? String(w.dosis_potasio_lbs) : null,
                        dosis_magnesio_lbs: w.dosis_magnesio_lbs !== null ? String(w.dosis_magnesio_lbs) : null,
                        dosis_calcio_lbs: w.dosis_calcio_lbs !== null ? String(w.dosis_calcio_lbs) : null,
                        dosis_boro_g: w.dosis_boro_g !== null ? String(w.dosis_boro_g) : null,
                        observaciones_tecnicas: w.observaciones_tecnicas,
                        tipo_registro: 'semanal'
                    }));
                    await db.insert(fertilization_plans).values(insertValues);
                    totalSemanal += weeks.length;
                }

                console.log(`✅ ${m.cultivo} ${m.variedad} (${m.zona}) — general + ${weeks.length} semanas`);

            } catch (err: any) {
                console.error(`❌ Error en ${file}: ${err.message}`);
                errores++;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎉 Extracción completa:`);
        console.log(`   📋 Registros generales:  ${totalGeneral}`);
        console.log(`   📅 Registros semanales:  ${totalSemanal}`);
        console.log(`   📊 TOTAL registros:      ${totalGeneral + totalSemanal}`);
        console.log(`   ❌ Archivos con errores: ${errores}`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

processXLSFiles();
