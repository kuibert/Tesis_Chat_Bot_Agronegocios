import { embeddingService } from '../src/services/embeddingService';
import { db } from '../src/db';
import { fertilization_plans } from '../src/db/schema';
import { isNull, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno (simulado desde .env en root backend)
dotenv.config({ path: path.join(__dirname, '../.env') });

async function generateEmbeddings() {
    console.log('🚀 Iniciando proceso de generación de Embeddings...');

    try {
        console.log('✅ Base de datos conectada.');

        // Obtener planes sin embedding vía Drizzle
        const plans = await db.select({
            id: fertilization_plans.id,
            cultivo: fertilization_plans.cultivo,
            variedad: fertilization_plans.variedad,
            zona: fertilization_plans.zona,
            dias_cosecha: fertilization_plans.dias_cosecha,
            formula_npk: fertilization_plans.formula_npk,
            fuente_potasio: fertilization_plans.fuente_potasio,
            observaciones_tecnicas: fertilization_plans.observaciones_tecnicas
        })
            .from(fertilization_plans)
            .where(isNull(fertilization_plans.embedding));

        if (plans.length === 0) {
            console.log('✨ Todos los planes ya tienen embeddings generados.');
            return;
        }

        console.log(`📋 Encontrados ${plans.length} planes sin procesar.`);

        // Procesar cada plan
        for (let i = 0; i < plans.length; i++) {
            const plan = plans[i];

            // Construir texto representativo para el embedding
            // IMPORTANTE: Incluir contexto clave para la búsqueda semántica
            const textToEmbed = `
          Cultivo: ${plan.cultivo} ${plan.variedad || ''}.
          Zona: ${plan.zona}.
          Etapa: ${plan.dias_cosecha} días a cosecha.
          Fórmula NPK: ${plan.formula_npk}.
          Fuente Potasio: ${plan.fuente_potasio}.
          Observaciones: ${plan.observaciones_tecnicas}.
        `.trim();

            console.log(`🔄 Procesando [${i + 1}/${plans.length}]: ${plan.cultivo} (${plan.zona})...`);

            try {
                // Generar vector usando DistilBERT multilingüe (Xenova/distiluse-base-multilingual-cased-v2)
                const { pgVector } = await embeddingService.generateEmbedding(textToEmbed);

                // Guardar en BD usando Drizzle
                await db.update(fertilization_plans)
                    .set({ embedding: pgVector as any })
                    .where(eq(fertilization_plans.id, plan.id));

            } catch (embError) {
                console.error(`❌ Error generando embedding para ID ${plan.id}:`, embError);
                // Continuar con el siguiente
            }
        }

        console.log('🎉 Proceso completado exitosamente.');

    } catch (err) {
        console.error('❌ Error crítico en el script:', err);
    }
}

// Ejecutar script
generateEmbeddings();
