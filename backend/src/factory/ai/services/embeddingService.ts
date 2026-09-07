/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  EMBEDDING SERVICE V2 — Controlador del Worker Thread        ║
 * ║                                                               ║
 * ║  ANTES (V1): DistilBERT corría DENTRO del hilo principal     ║
 * ║  de Node.js, bloqueando el Event Loop con cada petición.     ║
 * ║                                                               ║
 * ║  AHORA (V2): DistilBERT corre en un Worker Thread separado. ║
 * ║  Este archivo solo envía texto al worker y espera la          ║
 * ║  respuesta como una Promesa asíncrona (I/O, no CPU).         ║
 * ║                                                               ║
 * ║  La API pública NO CAMBIÓ: generateEmbedding(text) sigue     ║
 * ║  devolviendo { vector, pgVector } exactamente igual.         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
import { Worker } from 'worker_threads';
import path from 'path';

const EMBEDDING_DIMENSION = 768;

// Timeout para peticiones individuales (30 segundos)
const REQUEST_TIMEOUT_MS = 30_000;

/** Promesa pendiente esperando la respuesta del Worker */
interface PendingRequest {
  resolve: (vector: number[]) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Servicio Singleton para generar Embeddings.
 * 
 * V2: Delega el trabajo pesado a un Worker Thread.
 * El hilo principal de Node.js NUNCA se bloquea.
 */
class EmbeddingService {
  private static instance: EmbeddingService;
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestCounter: number = 0;

  private constructor() {
    this.readyPromise = this.initWorker();
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Inicializa el Worker Thread que carga DistilBERT.
   * Se ejecuta una sola vez cuando el servidor arranca.
   */
  private initWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Detectar si estamos en dev (.ts) o producción (.js)
      const isTypeScript = __filename.endsWith('.ts');
      const workerFile = isTypeScript ? 'embedding.worker.ts' : 'embedding.worker.js';
      const workerPath = path.resolve(__dirname, workerFile);

      // En dev, necesitamos que el worker use tsx para compilar TypeScript
      const workerOptions: any = {};
      if (isTypeScript) {
        workerOptions.execArgv = ['--require', 'tsx/cjs'];
      }

      console.log(`🔧 [EmbeddingService] Iniciando Worker en: ${workerFile}`);
      this.worker = new Worker(workerPath, workerOptions);

      // ── Escuchar mensajes del Worker ──
      this.worker.on('message', (message: any) => {
        // El worker terminó de cargar el modelo
        if (message.type === 'ready') {
          this.isReady = true;
          console.log('✅ [EmbeddingService] Worker listo para recibir peticiones.');
          resolve();
          return;
        }

        // Error al inicializar el modelo
        if (message.type === 'init-error') {
          console.error('❌ [EmbeddingService] Worker falló al cargar el modelo:', message.error);
          reject(new Error(message.error));
          return;
        }

        // Respuesta exitosa a una petición de embedding
        if (message.type === 'result' && message.id) {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            clearTimeout(pending.timer);
            pending.resolve(message.vector);
            this.pendingRequests.delete(message.id);
          }
          return;
        }

        // Error en una petición de embedding
        if (message.type === 'error' && message.id) {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            clearTimeout(pending.timer);
            pending.reject(new Error(message.error));
            this.pendingRequests.delete(message.id);
          }
          return;
        }
      });

      // ── Manejo de errores fatales del Worker ──
      this.worker.on('error', (error: Error) => {
        console.error('❌ [EmbeddingService] Error fatal en el Worker:', error);
        // Rechazar todas las peticiones pendientes
        for (const [, pending] of this.pendingRequests) {
          clearTimeout(pending.timer);
          pending.reject(new Error('Worker falló: ' + error.message));
        }
        this.pendingRequests.clear();
        this.isReady = false;
      });

      // ── Manejo de cierre inesperado del Worker ──
      this.worker.on('exit', (code: number) => {
        if (code !== 0) {
          console.error(`❌ [EmbeddingService] Worker terminó con código: ${code}. Reiniciando...`);
          this.isReady = false;
          this.worker = null;
          // Auto-reiniciar el worker
          this.readyPromise = this.initWorker();
        }
      });
    });
  }

  /**
   * Genera el embedding vectorial para un texto dado.
   * 
   * API IDÉNTICA a la V1 — el resto del código NO necesita cambios.
   * 
   * @param text Texto a procesar (ej: "Fertilización tomate Comayagua")
   * @returns Array de 768 números y string formateado para pgvector.
   */
  public async generateEmbedding(text: string): Promise<{ vector: number[]; pgVector: string }> {
    // Esperar a que el Worker termine de cargar el modelo
    await this.readyPromise;

    if (!this.worker) {
      throw new Error('Worker no disponible. El servicio de embeddings no está activo.');
    }

    // Generar un ID único para esta petición
    const id = `req-${++this.requestCounter}`;

    // Enviar el texto al Worker y esperar la respuesta como Promesa
    const vector = await new Promise<number[]>((resolve, reject) => {
      // Timeout de seguridad para evitar promesas colgadas
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Timeout: el Worker tardó más de ${REQUEST_TIMEOUT_MS / 1000}s en responder.`));
      }, REQUEST_TIMEOUT_MS);

      // Registrar la petición pendiente
      this.pendingRequests.set(id, { resolve, reject, timer });

      // Enviar el texto al worker (esto NO bloquea el Event Loop)
      this.worker!.postMessage({ id, text });
    });

    // Validar dimensiones (768 para DistilBERT)
    if (vector.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Dimensión incorrecta de embedding: ${vector.length} (esperado ${EMBEDDING_DIMENSION})`
      );
    }

    // Formatear para PostgreSQL pgvector: "[0.123, -0.456, ...]"
    const pgVector = `[${vector.join(',')}]`;

    return { vector, pgVector };
  }
}

export const embeddingService = EmbeddingService.getInstance();

