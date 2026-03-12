import { pipeline, env } from '@xenova/transformers';

// Configuración para que funcione en Node.js (saltar chequeos de navegador)
env.allowLocalModels = false; // Descargar si no están locales
env.useBrowserCache = false;

// DistilBERT multilingüe con soporte ONNX nativo — recomendado por asesor
// Soporta español + 50 idiomas más, optimizado para similitud semántica de oraciones
const MODEL_NAME = 'Xenova/distiluse-base-multilingual-cased-v2';
const EMBEDDING_DIMENSION = 768; // DistilBERT base hidden_size = 768 dims vía transformers.js

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
     * @returns Array de números (768 dimensiones — DistilBERT base) y string formateado para pgvector.
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

        // Validar dimensiones (DistilBERT base hidden_size = 768)
        if (vector.length !== EMBEDDING_DIMENSION) {
            throw new Error(`Dimensión incorrecta de embedding: ${vector.length} (esperado ${EMBEDDING_DIMENSION})`);
        }

        // Formatear para PostgreSQL pgvector: "[0.123, -0.456, ...]"
        const pgVector = `[${vector.join(',')}]`;

        return { vector, pgVector };
    }
}

export const embeddingService = EmbeddingService.getInstance();
