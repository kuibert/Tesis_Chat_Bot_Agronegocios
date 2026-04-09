import { eq, isNull, inArray } from "drizzle-orm";
import pLimit from "p-limit";

import { db } from "../src/database/db";
import { documentChunks } from "../src/database/schema/documentChunk";
import { embeddingService } from "../src/services/embeddingService";

const CONCURRENCY_LIMIT = 10; // Tareas simultáneas
const FETCH_BATCH_SIZE = 1000;

const limit = pLimit(CONCURRENCY_LIMIT);

(async () => {
  console.log("Iniciando...");

  try {
    const allPending = await db
      .select({ id: documentChunks.id })
      .from(documentChunks)
      .where(isNull(documentChunks.embedding));

    const total = allPending.length;
    if (total === 0) {
      console.log("Todo esta al día.");
      return;
    }

    console.log(`Total a procesar: ${total}.`);
    console.log(`Espere....`);
    console.log(`NOTA: No cierre la consola.`);

    for (let i = 0; i < total; i += FETCH_BATCH_SIZE) {
      const currentBatchIds = allPending
        .slice(i, i + FETCH_BATCH_SIZE)
        .map((row) => row.id);

      const loadedChunks = await db
        .select({ id: documentChunks.id, content: documentChunks.content })
        .from(documentChunks)
        .where(inArray(documentChunks.id, currentBatchIds));

      process.stdout.write(
        `\nProcesando bloque: ${i + 1} a ${Math.min(i + FETCH_BATCH_SIZE, total)}...\n`,
      );

      const tasks = loadedChunks.map((chunk) =>
        limit(async () => {
          try {
            const { vector } = await embeddingService.generateEmbedding(
              chunk.content,
            );
            await db
              .update(documentChunks)
              .set({ embedding: vector })
              .where(eq(documentChunks.id, chunk.id));
          } catch (err) {
            console.error(`Error en ID ${chunk.id}`);
          }
        }),
      );

      await Promise.all(tasks);
      const progress = (((i + loadedChunks.length) / total) * 100).toFixed(2);
      console.log(`Progreso total: ${progress}%`);
    }

    console.log("\n¡Listo! 14,000 registros procesados.");
  } catch (error) {
    console.error("Error fatal:", error);
  } finally {
    console.log("Proceso finalizado.");
  }
})();
