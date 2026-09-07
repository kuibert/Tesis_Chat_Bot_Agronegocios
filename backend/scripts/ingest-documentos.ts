// backend/scripts/ingest-documentos.ts
//
// Ingesta de documentos NO-PDF: Word (.docx), texto plano (.txt/.md/.csv), HTML.
// Mismo patrón transaccional/idempotente que ingest-pdfs.ts — deliberadamente
// un script hermano, no un reemplazo, para no tocar el pipeline de PDF que ya
// funciona.
//
// npm install mammoth jsdom @mozilla/readability

import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import mammoth from "mammoth";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { db } from "../src/database/db";
import { documents } from "../src/database/schema/document";
import { documentChunks } from "../src/database/schema/documentChunk";
import { eq } from "drizzle-orm";
import { embeddingService } from "../src/factory/ai/services/embeddingService";
import { createTextChunks } from "./utils/textChunking";
import { detectCropFromFileName } from "./utils/detectCrop";

const DOCS_DIR = path.resolve(
  __dirname,
  "../../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion"
);

const BATCH_SIZE = 8;

const EXTENSIONES_SOPORTADAS = [".docx", ".doc", ".txt", ".md", ".csv", ".html", ".htm"];

// ---------------------------------------------------------------------------
// Extracción de texto por tipo — cada rama devuelve texto plano completo
// ---------------------------------------------------------------------------

async function extraerTexto(filePath: string, ext: string): Promise<string> {
  if (ext === ".docx" || ext === ".doc") {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
  }
  if (ext === ".txt" || ext === ".md" || ext === ".csv") {
    return fs.readFileSync(filePath, "utf-8");
  }
  if (ext === ".html" || ext === ".htm") {
    const html = fs.readFileSync(filePath, "utf-8");
    const dom = new JSDOM(html);
    const articulo = new Readability(dom.window.document).parse();
    if (!articulo?.textContent?.trim()) {
      throw new Error("No se pudo extraer contenido legible del HTML");
    }
    return articulo.textContent;
  }
  throw new Error(`Extensión no soportada: ${ext}`);
}

// ---------------------------------------------------------------------------
// Orquestador — mismo esqueleto que ingestPDFs() en ingest-pdfs.ts
// ---------------------------------------------------------------------------

async function ingestDocumentos() {
  console.log(`\n📚 ═══════════════════════════════════════════════════════`);
  console.log(`   INICIANDO INGESTA DE DOCUMENTOS (Word / texto / HTML)`);
  console.log(`   Directorio: ${DOCS_DIR}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ El directorio ${DOCS_DIR} no existe.`);
    return;
  }

  const allFiles = fs.readdirSync(DOCS_DIR);
  const archivos = allFiles.filter((f) => EXTENSIONES_SOPORTADAS.includes(path.extname(f).toLowerCase()));

  console.log(`🔍 Se encontraron ${archivos.length} documentos para procesar.\n`);

  let totalDocsIngested = 0;
  let totalChunksIngested = 0;
  let totalOmitidos = 0;

  for (let fIndex = 0; fIndex < archivos.length; fIndex++) {
    const file = archivos[fIndex];
    const filePath = path.join(DOCS_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const cultivoDetectado = detectCropFromFileName(file);

    console.log(`\n📄 [${fIndex + 1}/${archivos.length}] Procesando: ${file}`);
    console.log(`   🌱 Cultivo asignado: "${cultivoDetectado}"`);

    try {
      const texto = await extraerTexto(filePath, ext);
      if (!texto || texto.trim().length === 0) {
        console.log(`   ⚠️  Sin texto extraíble, se omite.`);
        totalOmitidos++;
        continue;
      }

      const contentHash = createHash("sha256").update(texto).digest("hex");

      // Idempotencia por hash: si el contenido exacto ya existe, no reprocesar
      const [existente] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.contentHash, contentHash))
        .limit(1);

      if (existente) {
        console.log(`   ⏭️  Contenido idéntico ya ingerido (${file}), se omite.`);
        totalOmitidos++;
        continue;
      }

      const chunks = createTextChunks(texto);
      console.log(`   🧩 Total de fragmentos de texto: ${chunks.length}`);

      if (chunks.length === 0) {
        console.log(`   ⚠️  El texto extraído no generó chunks válidos, se omite.`);
        totalOmitidos++;
        continue;
      }

      await db.transaction(async (tx) => {
        // Idempotencia por nombre de archivo, igual que ingest-pdfs.ts
        await tx.delete(documents).where(eq(documents.fileName, file));

        const [insertedDoc] = await tx
          .insert(documents)
          .values({
            fileName: file,
            fileType: ext.replace(".", ""),
            fileUrl: filePath,
            contentHash,
          })
          .returning();

        let insertedChunksCount = 0;

        for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
          const batch = chunks.slice(batchStart, batchStart + BATCH_SIZE);
          const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);

          process.stdout.write(`   ⤔ Vectorizando lote ${batchStart + 1}–${batchEnd} de ${chunks.length}...\r`);

          const batchValues = await Promise.all(
            batch.map(async (chunkText) => {
              const contentWithContext = `[Documento: ${file}]\n${chunkText}`;
              const { vector } = await embeddingService.generateEmbedding(contentWithContext);

              return {
                content: contentWithContext,
                documentId: insertedDoc.id,
                pageNumber: null,
                embedding: vector,
                sourceName: file,
                metadata: {
                  chunk_type: "documento_general",
                  cultivo: cultivoDetectado,
                  frecuencia_riego: "estandar",
                },
              };
            })
          );

          await tx.insert(documentChunks).values(batchValues);
          insertedChunksCount += batchValues.length;
        }

        console.log(`\n   ✅ Guardados ${insertedChunksCount} chunks en la BD con embeddings vectoriales.`);
        totalChunksIngested += insertedChunksCount;
        totalDocsIngested++;
      });
    } catch (err: any) {
      console.error(`   ❌ Error al procesar ${file}:`, err.message);
    }
  }

  console.log(`\n✨ ═══════════════════════════════════════════════════════`);
  console.log(`   INGESTA DE DOCUMENTOS FINALIZADA`);
  console.log(`   📄 Documentos guardados: ${totalDocsIngested}`);
  console.log(`   🧩 Total chunks vectorizados: ${totalChunksIngested}`);
  console.log(`   ⏭️  Omitidos (duplicados o sin texto): ${totalOmitidos}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
  process.exit(0);
}

ingestDocumentos().catch((err) => {
  console.error("Error fatal en ingestDocumentos:", err);
  process.exit(1);
});
