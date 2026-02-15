import { pipeline, env } from '@xenova/transformers';

// Configuración para que funcione en Node.js (saltar chequeos de navegador)
env.allowLocalModels = false; // Descargar si no están locales
env.useBrowserCache = false;

// Modelo específico para Español (BERT)
const MODEL_NAME = 'dccuchile/bert-base-spanish-wwm-uncased';

/**
 * Servicio Singleton para generar Embeddings.
 * Carga el modelo una sola vez en memoria.
 */
class EmbeddingService {
    private static instance: EmbeddingService;
    private pipe: any = null;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    /**
     * Inicializa el pipeline de extracción de características.
     */
    private async initPipeline() {
        if (!this.pipe) {
            console.log(`⏳ Cargando modelo de embeddings: ${MODEL_NAME}...`);
            this.pipe = await pipeline('feature-extraction', MODEL_NAME);
            console.log('✅ Modelo cargado correctamente.');
        }
    }

    /**
     * Genera el embedding vectorial para un texto dado.
     * @param text Texto a procesar (ej: "Fertilización tomate Comayagua")
     * @returns Array de números (768 dimensiones) y string formateado para pgvector.
     */
    public async generateEmbedding(text: string): Promise<{ vector: number[]; pgVector: string }> {
        await this.initPipeline();

        // Limpieza básica del texto
        const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');

        // Generar embedding
        // pooling: 'mean' es estándar para representaciones de oraciones con BERT
        // normalize: true para usar similitud coseno
        const output = await this.pipe(cleanText, { pooling: 'mean', normalize: true });

        // Convertir Tensor a Array normal de JavaScript
        const vector = Array.from(output.data) as number[];

        // Validar dimensiones (BERT base = 768)
        if (vector.length !== 768) {
            throw new Error(`Dimensión incorrecta de embedding: ${vector.length} (esperado 768)`);
        }

        // Formatear para PostgreSQL pgvector: "[0.123, -0.456, ...]"
        const pgVector = `[${vector.join(',')}]`;

        return { vector, pgVector };
    }
}

export const embeddingService = EmbeddingService.getInstance();
