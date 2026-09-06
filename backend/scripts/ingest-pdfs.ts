import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { db } from "../src/database/db";
import { documents } from "../src/database/schema/document";
import { documentChunks } from "../src/database/schema/documentChunk";
import { eq } from "drizzle-orm";
import { embeddingService } from "../src/services/embeddingService";
import { createTextChunks } from "./utils/textChunking";
import { detectCropFromFileName } from "./utils/detectCrop";

const PDF_DIR = path.resolve(
  __dirname,
  "../../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion"
);

const BATCH_SIZE = 8;

async function ingestPDFs() {
  console.log(`\n📚 ═══════════════════════════════════════════════════════`);
  console.log(`   INICIANDO INGESTA DE DOCUMENTOS PDF TÉCNICOS`);
  console.log(`   Directorio: ${PDF_DIR}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  if (!fs.existsSync(PDF_DIR)) {
    console.error(`❌ El directorio ${PDF_DIR} no existe.`);
    return;
  }

  const allFiles = fs.readdirSync(PDF_DIR);
  const pdfFiles = allFiles.filter(f => f.toLowerCase().endsWith(".pdf"));

  console.log(`🔍 Se encontraron ${pdfFiles.length} archivos PDF para procesar.\n`);

  let totalDocsIngested = 0;
  let totalChunksIngested = 0;

  for (let fIndex = 0; fIndex < pdfFiles.length; fIndex++) {
    const file = pdfFiles[fIndex];
    const filePath = path.join(PDF_DIR, file);
    const cultivoDetectado = detectCropFromFileName(file);

    console.log(`\n📄 [${fIndex + 1}/${pdfFiles.length}] Procesando PDF: ${file}`);
    console.log(`   🌱 Cultivo asignado: "${cultivoDetectado}"`);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const contentHash = createHash("sha256").update(fileBuffer).digest("hex");

      // Idempotencia por hash: omitir si ya fue ingerido con contenido idéntico
      const [existente] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.contentHash, contentHash))
        .limit(1);

      if (existente) {
        console.log(`   ⏭️  Contenido idéntico ya ingerido (${file}), se omite.`);
        continue;
      }

      const data = new Uint8Array(fileBuffer);
      const doc = await pdfjs.getDocument({
        data,
        isEvalSupported: false,
        useSystemFonts: true,
      }).promise;

      console.log(`   📖 Páginas encontradas: ${doc.numPages}`);

      // Extraer y chunkear por página
      const pageChunksList: { pageNum: number; chunkText: string }[] = [];

      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((i: any) => i.str).join(" ");
        const chunks = createTextChunks(pageText);

        for (const chunk of chunks) {
          pageChunksList.push({
            pageNum: p,
            chunkText: chunk
          });
        }
      }

      console.log(`   🧩 Total de fragmentos de texto: ${pageChunksList.length}`);

      if (pageChunksList.length === 0) {
        console.log(`   ⚠️ No se extrajo texto del PDF (posible documento escaneado/imagen).`);
        continue;
      }

      // Ingesta transaccional e idempotente en PostgreSQL
      await db.transaction(async (tx) => {
        // 1. Eliminar versiones previas de este documento si existen
        await tx.delete(documents).where(eq(documents.fileName, file));

        // 2. Insertar documento madre
        const [insertedDoc] = await tx
          .insert(documents)
          .values({
            fileName: file,
            fileType: "pdf",
            fileUrl: filePath,
            contentHash,
          })
          .returning();

        // 3. Procesar embeddings en lotes
        let insertedChunksCount = 0;

        for (let batchStart = 0; batchStart < pageChunksList.length; batchStart += BATCH_SIZE) {
          const batch = pageChunksList.slice(batchStart, batchStart + BATCH_SIZE);
          const batchEnd = Math.min(batchStart + BATCH_SIZE, pageChunksList.length);

          process.stdout.write(`   ⤔ Vectorizando lote ${batchStart + 1}–${batchEnd} de ${pageChunksList.length}...\r`);

          const batchValues = await Promise.all(
            batch.map(async (item, idxInBatch) => {
              const contentWithContext = `[Documento: ${file} | Pág: ${item.pageNum}]\n${item.chunkText}`;
              const { vector } = await embeddingService.generateEmbedding(contentWithContext);

              return {
                content: contentWithContext,
                documentId: insertedDoc.id,
                pageNumber: item.pageNum,
                embedding: vector,
                sourceName: file,
                metadata: {
                  chunk_type: "pdf_guide",
                  cultivo: cultivoDetectado,
                  frecuencia_riego: "estandar"
                }
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
  console.log(`   INGESTA DE PDFs FINALIZADA CON ÉXITO`);
  console.log(`   📄 Documentos guardados: ${totalDocsIngested}`);
  console.log(`   🧩 Total chunks vectorizados: ${totalChunksIngested}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
  process.exit(0);
}

ingestPDFs().catch((err) => {
  console.error("Error fatal en ingestPDFs:", err);
  process.exit(1);
});
