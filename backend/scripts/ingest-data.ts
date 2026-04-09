import path from "path";

import {
  createChunks,
  fileContent,
  ingestDirectory,
  loadDirectory,
} from "./ingest-directory";
import { db } from "../src/database/db";
import { documents } from "../src/database/schema/document";
import { documentChunks } from "../src/database/schema/documentChunk";
import { eq, InferInsertModel, sql } from "drizzle-orm";

const DATA_PATH = path.resolve(
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
  const filesDirectory = await loadDirectory(DATA_PATH);

  console.log(`Se encontraron ${filesDirectory.length} archivos para procesar`);

  for (const file of filesDirectory) {
    const isExist = await isDocumentExist(file.name);

    if (isExist) {
      console.log(`Saltando ${file.name}, ya existe.`);
      continue;
    }

    await db.transaction(async (tx) => {
      console.log(`Insertando ${file.name}...`);

      const document = await insertDocument({
        document: {
          fileName: file.name,
          fileType: file.extension,
          fileUrl: file.path,
        },
        instance: tx,
      });

      const contentFile = await fileContent(file);
      const chunks = createChunks(contentFile, 1000, 0.1);

      const values = chunks.map((chunk, index) => ({
        content: chunk,
        documentId: document.id,
        pageNumber: index + 1,
      }));

      await tx.insert(documentChunks).values(values);

      console.log(`Chunks ${values.length} para el documento ${file.name}`);

      console.log(`Documento guardado con ID: ${document.id}`);
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
