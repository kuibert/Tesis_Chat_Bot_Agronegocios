import { db } from "../db";
import { documents } from "../schema/document";
import { documentChunks } from "../schema/documentChunk";
import { sql, eq, and } from "drizzle-orm";

function isFertilizerListQuery(query: string): boolean {
  const q = query.toLowerCase();
  
  // 1. Detectar si coincide con el regex de lenguaje natural original
  //    (por si la consulta llega sin reescribir o el reescritor no se ejecuta)
  if (/qué fertilizantes|lleva el|lista de fertilizantes|fertilizantes disponibles|fertilizantes para el|fertilizante para el/.test(q)) {
    return true;
  }
  
  // 2. Detectar si es la query Standalone reformulada (genérica, sin productos específicos)
  //    El reescritor deja "apio fertilizante Fertilizantes" o similar.
  //    Si contiene "fertilizante" o "fertilizantes" PERO NO contiene nombres de productos,
  //    asumimos que es una consulta de catálogo.
  const tieneFertilizante = q.includes("fertilizante") || q.includes("fertilizantes");
  const tieneProductoEspecifico = /nitrato|urea|map|dap|sulfato|cloruro|solubor|carbonato|amonio|potasio|magnesio|calcio|fosfato|melaza/.test(q);
  
  return tieneFertilizante && !tieneProductoEspecifico;
}

/**
 * Obtiene todos los nombres de archivos únicos de la tabla documents.
 * Se usa para detectar dinámicamente si el usuario mencionó un cultivo.
 */
export const getAllCropNames = async (): Promise<string[]> => {
  const result = await db
    .selectDistinct({ fileName: documents.fileName })
    .from(documents);
  return result.map(r => r.fileName);
};

/**
 * Busca los chunks más similares al embedding dado.
 * @param cropFilter - Si se proporciona, filtra por archivos cuyo nombre contenga este texto.
 * @param sheetFilter - Si se proporciona, filtra por chunks cuyo contenido mencione esta hoja de Excel.
 */
export const findSimilarChunks = async (
  embedding: number[], 
  limit = 15, 
  minSimilarity = 0.20,
  cropFilter?: string,
  sheetFilter?: string,
  searchString?: string
) => {
  const vectorQuery = `[${embedding.join(',')}]`;
  
  // Vector Score: 1 - cosine distance
  const vectorScore = sql<number>`1 - (${documentChunks.embedding} <=> ${vectorQuery})`;
  
  let keywordScore = sql<number>`0`;
  let combinedScore = vectorScore;
  
  if (searchString && searchString.trim() !== '') {
    // Convierte "dosis aguacate semana 1" en "dosis | aguacate | semana | 1"
    // Reemplaza signos de puntuación para evitar errores de sintaxis en to_tsquery
    const cleanString = searchString.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '');
    const orSearchString = cleanString.trim().split(/\s+/).filter(Boolean).join(' | ');

    // Keyword Score: PostgreSQL Full Text Search Rank (Flexible OR)
    keywordScore = sql<number>`ts_rank_cd(to_tsvector('spanish', ${documentChunks.content}), to_tsquery('spanish', ${orSearchString}))`;
    // Hybrid Score: 90% Vector, 10% Keyword
    combinedScore = sql<number>`(${vectorScore} * 0.9) + (${keywordScore} * 0.1)`;
  }

  // Boost para preguntas de tipo lista de fertilizantes
  if (searchString && isFertilizerListQuery(searchString)) {
    combinedScore = sql<number>`(${combinedScore}) + (CASE WHEN ${documentChunks.metadata}->>'chunk_type' = 'fertilizer_list' THEN 0.3 ELSE 0 END)`;
  }

  // Apilamos las condiciones dinámicamente
  const conditions = [
    sql`${vectorScore} >= ${minSimilarity}`
  ];

  if (cropFilter) {
    conditions.push(sql`LOWER(${documents.fileName}) LIKE ${`%${cropFilter.toLowerCase()}%`}`);
  }

  let finalSheetFilter = sheetFilter;
  if (!finalSheetFilter && searchString) {
    const q = searchString.toLowerCase();
    if (q.includes('1 por sem') || q.includes('1 vez por semana') || q.includes('cada semana') || q.includes('primera semana') || q.includes('semana 1') || q.includes('1ra semana')) {
      finalSheetFilter = '1 Por Sem';
    } else if (q.includes('2 por sem') || q.includes('2 veces por semana') || q.includes('bisemanal')) {
      finalSheetFilter = '2 Por Sem';
    } else if (q.includes('14 dias') || q.includes('cada 14 días') || q.includes('quincenal')) {
      finalSheetFilter = '14 Dias';
    } else if (q.includes('cal-diario') || q.includes('diario') || q.includes('cada día')) {
      finalSheetFilter = 'Cal-Diario';
    }
  }

  if (finalSheetFilter) {
    // Busca exactamente la subcadena de la hoja en el contenido del chunk
    conditions.push(sql`${documentChunks.content} LIKE ${`%(hoja: ${finalSheetFilter})%`}`);
  }

  const effectiveLimit = finalSheetFilter ? 5 : limit;

  let query = db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      similarity: combinedScore,
      vectorScore: vectorScore,
      keywordScore: keywordScore,
      fileName: documents.fileName,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(and(...conditions))
    .orderBy(sql`${combinedScore} DESC`)
    .limit(effectiveLimit);

  return await query;
};
