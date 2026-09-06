import { db } from "../db";
import { documents } from "../schema/document";
import { documentChunks } from "../schema/documentChunk";
import { sql, eq, and } from "drizzle-orm";

function isFertilizerListQuery(query: string): boolean {
  const q = query.toLowerCase();
  
  // Si la pregunta pide dosis, cantidad, semanas específicas o aplicar, NO es una consulta de catálogo genérica
  if (/dosis|cantidad|cu[aá]nto|semana|aplicar|d[ií]as|ddt|manzanas?|hect[aá]reas?|m2|m²/.test(q)) {
    return false;
  }
  
  // 1. Detectar si coincide con el regex de lenguaje natural de catálogo
  if (/qu[eé] fertilizantes|lleva el|lista de fertilizantes|fertilizantes disponibles|fertilizantes para el|fertilizante para el/.test(q)) {
    return true;
  }
  
  // 2. Detectar si es la query Standalone reformulada (genérica, sin productos específicos)
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
  searchString?: string,
  targetWeek?: number
) => {
  const vectorQuery = `[${embedding.join(',')}]`;
  
  // Vector Score: 1 - cosine distance
  const vectorScore = sql<number>`(1 - (${documentChunks.embedding} <=> ${vectorQuery}::vector))`;
  
  let keywordScore = sql<number>`0.0`;
  let combinedScore = vectorScore;
  const q = (searchString || "").toLowerCase();
  
  if (searchString && searchString.trim() !== '') {
    const cleanWords = searchString
      .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 1);

    if (cleanWords.length > 0) {
      const orSearchString = cleanWords.join(' | ');
      keywordScore = sql<number>`COALESCE(ts_rank_cd(to_tsvector('spanish', ${documentChunks.content}), to_tsquery('spanish', ${orSearchString})), 0.0)`;
      combinedScore = sql<number>`((${vectorScore} * 0.9) + (${keywordScore} * 0.1))`;
    }
  }

  // Boost para preguntas de tipo lista de fertilizantes de catálogo
  if (searchString && isFertilizerListQuery(searchString)) {
    combinedScore = sql<number>`(${combinedScore} + (CASE WHEN ${documentChunks.metadata}->>'chunk_type' = 'fertilizer_list' THEN 0.3 ELSE 0.0 END))`;
  }

  // Boost prioritario (+0.50 o +1.0) si se detecta un número de semana
  let semanaNum: number | null = null;
  if (targetWeek !== undefined) {
    semanaNum = targetWeek;
  } else {
    const semanaMatch = q.match(/(?:semana|sem)\s*[:#]?\s*(\d+)/i) || q.match(/(\d+)\s*(?:semanas?|sem)\b/i);
    if (semanaMatch) semanaNum = parseInt(semanaMatch[1], 10);
  }

  if (semanaNum !== null) {
    const boostValue = targetWeek !== undefined ? 1.0 : 0.50;
    combinedScore = sql<number>`(${combinedScore} + (CASE WHEN ${documentChunks.content} LIKE ${`%"semana": ${semanaNum},%`} OR ${documentChunks.content} LIKE ${`%Semana: ${semanaNum}%`} OR ${documentChunks.content} LIKE ${`%semana ${semanaNum}%`} THEN ${boostValue} ELSE 0.0 END))`;
  }

  // Boost adicional (+0.40) si se menciona DDT (días después del trasplante)
  const ddtMatch = q.match(/(\d+)\s*(?:d[ií]as?\s+(?:despu[eé]s|ddt)|ddt\b)/i) || q.match(/ddt\s*[:#]?\s*(\d+)/i);
  if (ddtMatch) {
    const ddtNum = parseInt(ddtMatch[1], 10);
    combinedScore = sql<number>`(${combinedScore} + (CASE WHEN ${documentChunks.content} LIKE ${`%"ddt": ${ddtNum},%`} OR ${documentChunks.content} LIKE ${`%DDT: ${ddtNum}%`} THEN 0.40 ELSE 0.0 END))`;
  }

  // Apilamos las condiciones dinámicamente
  const conditions = [
    sql`${vectorScore} >= ${minSimilarity}`
  ];

  if (cropFilter) {
    conditions.push(sql`LOWER(${documents.fileName}) LIKE ${`%${cropFilter.toLowerCase()}%`}`);
  }

  // 1. Detección inteligente de frecuencia / hoja de fertilización comercial
  let finalSheetFilter = sheetFilter;

  if (!finalSheetFilter && searchString) {
    if (
      q.includes('2 por sem') || 
      q.includes('2 veces por semana') || 
      q.includes('dos veces por semana') || 
      q.includes('bisemanal')
    ) {
      finalSheetFilter = '2 Por Sem';
    } else if (
      q.includes('3 por sem') || 
      q.includes('3 veces por semana') || 
      q.includes('tres veces por semana')
    ) {
      finalSheetFilter = '3 Por Sem';
    } else if (
      q.includes('14 dias') || 
      q.includes('14 días') || 
      q.includes('cada 14 días') || 
      q.includes('cada 14 dias') || 
      q.includes('cada dos semanas') || 
      q.includes('quincenal') ||
      q.includes('quincena')
    ) {
      finalSheetFilter = '14 Dias';
    } else if (
      q.includes('cal-diario') || 
      q.includes('diario') || 
      q.includes('diaria') || 
      q.includes('cada día') || 
      q.includes('cada dia')
    ) {
      finalSheetFilter = 'Cal-Diario';
    } else if (
      (q.includes('1 por sem') || 
      q.includes('1 vez por semana') || 
      q.includes('una vez por semana') || 
      q.includes('cada semana') || 
      q.includes('semanal') || 
      q.includes('esta semana') || 
      q.includes('primera semana') || 
      q.includes('1ra semana') ||
      /semana\s*\d+/i.test(q) ||
      /d[ií]as?\s+despu[eé]s/i.test(q) ||
      /\bddt\b/i.test(q)) &&
      !q.includes('pdf') &&
      !q.includes('manual') &&
      !q.includes('guia') &&
      !q.includes('guía')
    ) {
      finalSheetFilter = '1 Por Sem';
    }
  }

  // 2. Exclusión de hojas teóricas (Req. Diario, ReSemanalFert, ReDiarioFert), permitiendo siempre PDFs
  const pideRequerimientos = /requerimiento|absorci[oó]n|extracci[oó]n|nutricional|nutriente/i.test(q);
  if (!pideRequerimientos) {
    conditions.push(sql`(${documentChunks.content} NOT LIKE '%(hoja: Req. Diario)%' OR ${documents.fileType} = 'pdf')`);
    conditions.push(sql`(${documentChunks.content} NOT LIKE '%(hoja: ReSemanalFert)%' OR ${documents.fileType} = 'pdf')`);
    conditions.push(sql`(${documentChunks.content} NOT LIKE '%(hoja: ReDiarioFert)%' OR ${documents.fileType} = 'pdf')`);
  }

  if (finalSheetFilter) {
    conditions.push(sql`(${documentChunks.content} LIKE ${`%(hoja: ${finalSheetFilter})%`} OR ${documents.fileType} = 'pdf')`);
  }

  const effectiveLimit = finalSheetFilter ? 8 : limit;

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
    .orderBy(sql`3 DESC`)
    .limit(effectiveLimit);

  return await query;
};
