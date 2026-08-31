import path from "path";
import fs from "fs/promises";

import {
  createChunks,
  fileContent,
  ingestDirectory,
  loadDirectory,
} from "./ingest-directory";
import { db } from "../src/database/db";
import { documents } from "../src/database/schema/document";
import { documentChunks } from "../src/database/schema/documentChunk";
import { eq, InferInsertModel } from "drizzle-orm";
import { embeddingService } from "../src/services/embeddingService";

// Carpeta donde el script de Python almacena los CSVs limpios
const DATA_PATH = path.resolve(__dirname, "../../data/csv");

// Carpeta donde se encuentran los archivos Excel originales para mapeo de nombres
const EXCELS_DATA_PATH = path.resolve(
  __dirname,
  "../../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion",
);

const isDocumentExist = async (fileName: string): Promise<boolean> => {
  const existingDocs = await db
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.fileName, fileName))
    .limit(1);

  return existingDocs.length > 0;
};

type DocumentInsertType = InferInsertModel<typeof documents>;
const insertDocument = async ({
  document,
  instance,
}: {
  document: DocumentInsertType;
  instance: any;
}) => {
  const [insertedDoc] = await instance
    .insert(documents)
    .values({
      ...document,
    })
    .returning();

  return insertedDoc;
};

const ingestData = async (pathDirectory: string) => {
  // 1. Cargar el mapeo de archivos Excel originales (stem -> original metadata)
  const excelsMap = new Map<string, { fileName: string; fileType: string; fileUrl: string }>();
  try {
    const originalExcelFiles = await fs.readdir(EXCELS_DATA_PATH);
    for (const file of originalExcelFiles) {
      const ext = path.extname(file).toLowerCase();
      if ([".xls", ".xlsx"].includes(ext)) {
        const stem = path.basename(file, ext);
        excelsMap.set(stem, {
          fileName: file,
          fileType: ext,
          fileUrl: path.join(EXCELS_DATA_PATH, file)
        });
      }
    }
  } catch (e) {
    console.warn("⚠️ No se pudo leer la carpeta de Excels originales para mapeo:", e);
  }

  // 2. Cargar los archivos CSV procesados de la carpeta data/csv
  const filesDirectory = await loadDirectory(pathDirectory);
  console.log(`Se encontraron ${filesDirectory.length} archivos CSV para procesar en data/csv`);

  // 3. Agrupar los CSVs según el documento original al que pertenecen
  const groupedCsvs = new Map<string, typeof filesDirectory>();
  for (const file of filesDirectory) {
    const csvName = file.name;
    let foundStem = "";

    // Buscar el stem más largo coincidente para evitar falsos positivos
    const sortedStems = Array.from(excelsMap.keys()).sort((a, b) => b.length - a.length);
    for (const stem of sortedStems) {
      if (csvName.startsWith(stem + "_")) {
        foundStem = stem;
        break;
      }
    }

    const key = foundStem || csvName;
    if (!groupedCsvs.has(key)) {
      groupedCsvs.set(key, []);
    }
    groupedCsvs.get(key)!.push(file);
  }

  // 4. Ingestar cada documento original con todos sus chunks de hojas (CSVs) agrupados
  for (const [docKey, csvFiles] of groupedCsvs.entries()) {
    const excelMeta = excelsMap.get(docKey) || {
      fileName: `${docKey}.csv`,
      fileType: ".csv",
      fileUrl: path.join(pathDirectory, `${docKey}.csv`)
    };

    await db.transaction(async (tx) => {
      // 4.1 Idempotencia: Borrar el documento si ya existe (el cascade borrará sus chunks)
      const isExist = await isDocumentExist(excelMeta.fileName);
      if (isExist) {
        console.log(`🔄 Documento original ${excelMeta.fileName} ya existe. Eliminando para reingesta limpia...`);
        await tx.delete(documents).where(eq(documents.fileName, excelMeta.fileName));
      } else {
        console.log(`Insertando documento madre: ${excelMeta.fileName}...`);
      }

      const document = await insertDocument({
        document: {
          fileName: excelMeta.fileName,
          fileType: excelMeta.fileType,
          fileUrl: excelMeta.fileUrl,
        },
        instance: tx,
      });

      let pageCounter = 1;

      for (const csvFile of csvFiles) {
        console.log(`  ↳ Ingestando datos de la hoja: ${csvFile.name}...`);
        const fileResult = await fileContent(csvFile);

        const chunks = fileResult.dataChunks;

        // Procesar e insertar en lotes paralelos (batching)
        const BATCH_SIZE = 5;
        const values: Array<{
          content: string;
          documentId: string;
          pageNumber: number;
          embedding: number[];
          sourceName?: string;
          metadata?: { chunk_type: string; frecuencia_riego?: string; cultivo?: string; unidad_origen?: 'ha' | 'mz' };
        }> = [];

        // Generar e insertar el chunk de lista de fertilizantes si existe
        if (fileResult.fertilizerListChunk) {
          const flc = fileResult.fertilizerListChunk;
          const { vector } = await embeddingService.generateEmbedding(flc.content);
          values.push({
            content: flc.content,
            documentId: document.id,
            pageNumber: pageCounter++,
            embedding: vector,
            sourceName: flc.sheetName,
            metadata: { 
              chunk_type: "fertilizer_list",
              frecuencia_riego: fileResult.frecuencia_riego,
              cultivo: fileResult.cultivo
            }
          });
        }

        if (chunks.length === 0 && values.length === 0) continue;

        for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
          const batch = chunks.slice(batchStart, batchStart + BATCH_SIZE);
          const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
          console.log(`    ⤔ Procesando lote ${batchStart + 1}–${batchEnd} de ${chunks.length} chunks (${csvFile.name})...`);

          const batchResults = await Promise.all(
            batch.map(async (chunk, indexInBatch) => {
              const chunkWithContext = `[Cultivo/Archivo: ${excelMeta.fileName}]\n${chunk}`;
              const { vector } = await embeddingService.generateEmbedding(chunkWithContext);
              return {
                content: chunkWithContext,
                documentId: document.id,
                pageNumber: pageCounter++,
                embedding: vector,
                metadata: {
                  chunk_type: "data",
                  frecuencia_riego: fileResult.frecuencia_riego,
                  cultivo: fileResult.cultivo
                }
              };
            })
          );

          values.push(...batchResults);
        }

        if (values.length > 0) {
          await tx.insert(documentChunks).values(values);
          console.log(`    ✅ Insertados ${values.length} chunks de la hoja ${csvFile.name}`);
        }
      }

      console.log(`✨ Documento ${excelMeta.fileName} guardado con éxito con un total de ${pageCounter - 1} chunks.`);
    });
  }
};

(async () => {
  try {
    await ingestData(DATA_PATH);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "No se puede completar la tarea",
    );
  }
})();
