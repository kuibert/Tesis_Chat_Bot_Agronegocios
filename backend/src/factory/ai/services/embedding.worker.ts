/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  EMBEDDING WORKER — Hilo secundario para DistilBERT          ║
 * ║                                                               ║
 * ║  Este archivo corre en un Worker Thread separado.             ║
 * ║  Su ÚNICO trabajo es:                                         ║
 * ║    1. Cargar el modelo de IA (una sola vez al arrancar)       ║
 * ║    2. Recibir texto del hilo principal                        ║
 * ║    3. Convertirlo en un vector de 768 números                 ║
 * ║    4. Devolverlo al hilo principal                            ║
 * ║                                                               ║
 * ║  ¿Por qué existe? Para no bloquear el Event Loop de Node.js  ║
 * ║  mientras DistilBERT hace cálculos matemáticos pesados (CPU). ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */
import { parentPort } from 'worker_threads';
import { pipeline, env } from '@xenova/transformers';

// ── Configuración para que funcione en Node.js ──
env.allowLocalModels = false;
env.useBrowserCache = false;

// ── Modelo: DEBE ser el mismo que se usó en el pipeline de ingestión ──
// Si cambias este modelo, TODOS los vectores de tu BD se invalidan.
const MODEL_NAME = 'Xenova/distiluse-base-multilingual-cased-v2';
const EMBEDDING_DIMENSION = 768;

// El pipeline de transformers.js (se carga una sola vez)
let pipe: any = null;

/**
 * Carga el modelo en memoria. Solo se ejecuta una vez.
 * La primera vez puede tardar varios minutos si tiene que descargar el modelo.
 */
async function initPipeline(): Promise<void> {
  if (!pipe) {
    console.log(`⏳ [Worker] Cargando modelo de embeddings: ${MODEL_NAME}...`);
    pipe = await pipeline('feature-extraction', MODEL_NAME);
    console.log('✅ [Worker] Modelo cargado y listo para vectorizar.');
  }
}

/**
 * Procesa un texto y devuelve su vector de 768 dimensiones.
 */
async function processText(text: string): Promise<number[]> {
  await initPipeline();

  // Limpieza básica del texto (misma que la versión anterior)
  const cleanText = text.trim().toLowerCase().replace(/\s+/g, ' ');

  // Generar embedding con Mean Pooling + Normalización para similitud coseno
  const output = await pipe(cleanText, { pooling: 'mean', normalize: true });
  console.log('Dimensión real del embedding:', output.data.length);

  // Convertir Tensor a Array normal de JavaScript
  const vector = Array.from(output.data) as number[];

  // Validar dimensiones
  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Dimensión incorrecta de embedding: ${vector.length} (esperado ${EMBEDDING_DIMENSION})`
    );
  }

  return vector;
}

// ══════════════════════════════════════════════════════════════
// ARRANQUE DEL WORKER
// ══════════════════════════════════════════════════════════════

// 1. Cargar el modelo al iniciar el worker
initPipeline()
  .then(() => {
    // Notificar al hilo principal que estamos listos
    parentPort?.postMessage({ type: 'ready' });
  })
  .catch((error: any) => {
    console.error('❌ [Worker] Error al cargar el modelo:', error);
    parentPort?.postMessage({ type: 'init-error', error: error.message });
  });

// 2. Escuchar peticiones del hilo principal
parentPort?.on('message', async (message: { id: string; text: string }) => {
  try {
    const vector = await processText(message.text);

    // Devolver el resultado al hilo principal
    parentPort?.postMessage({
      type: 'result',
      id: message.id,
      vector,
    });
  } catch (error: any) {
    // Devolver el error al hilo principal
    parentPort?.postMessage({
      type: 'error',
      id: message.id,
      error: error.message,
    });
  }
});
