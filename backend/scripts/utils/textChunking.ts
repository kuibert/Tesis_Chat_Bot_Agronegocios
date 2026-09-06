// backend/scripts/utils/textChunking.ts
//
// Extraído de ingest-pdfs.ts (sin cambios de comportamiento) para reutilizar
// en cualquier script de ingesta, no solo PDFs.

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export function createTextChunks(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 20) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);

    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start + chunkSize * 0.7) {
        end = lastSpace;
      }
    }

    const chunk = clean.substring(start, end).trim();
    if (chunk.length >= 20) {
      chunks.push(chunk);
    }

    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks;
}
