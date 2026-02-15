import { Client } from 'pg';
import { embeddingService } from '../src/services/embeddingService';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno (simulado desde .env en root backend)
dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fertilization_db',
};

async function generateEmbeddings() {
    console.log('🚀 Iniciando proceso de generación de Embeddings...');

    const client = new Client(DB_CONFIG);

    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos.');

        // Verificar extensión pgvector
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

        // Obtener planes sin embedding
        // Asumimos tabla 'fertilization_plans' con columna 'embedding' tipo vector(768)
        const selectQuery = `
      SELECT id, cultivo, variedad, zona, dias_cosecha, formula_npk, fuente_potasio, observaciones_tecnicas
      FROM fertilization_plans
      WHERE embedding IS NULL;
    `;

        const res = await client.query(selectQuery);
        const plans = res.rows;

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
                // Generar vector usando el servicio BERT
                const { pgVector } = await embeddingService.generateEmbedding(textToEmbed);

                // Guardar en BD
                const updateQuery = `
              UPDATE fertilization_plans
              SET embedding = $1
              WHERE id = $2;
            `;

                await client.query(updateQuery, [pgVector, plan.id]);

            } catch (embError) {
                console.error(`❌ Error generando embedding para ID ${plan.id}:`, embError);
                // Continuar con el siguiente
            }
        }

        console.log('🎉 Proceso completado exitosamente.');

    } catch (err) {
        console.error('❌ Error crítico en el script:', err);
    } finally {
        await client.end();
    }
}

// Ejecutar script
generateEmbeddings();
