/**
 * rag.pipeline.ts
 * Responsabilidad única: Orquestar la extracción de contexto (RAG) desde la Base de Datos.
 */

import { Message } from "../ai-factory.types";
import { embeddingService } from "../../../services/embeddingService";
import * as documentRepository from "../../../database/repositories/document.repository";
import { rewriteQueryWithContext } from "../services/context.manager";
import { detectCrop } from "../utils/crop.detector";

export async function executeRAG(messages: Message[]): Promise<{ contextText: string; sources: string[] }> {
  try {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage?.content) return { contextText: "", sources: [] };

    // 1. Detectar cultivo en el historial (con persistencia de sesión)
    const allFileNames = await documentRepository.getAllCropNames();
    let cropFilter: string | undefined;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== "user") continue;
      const msgText = String(messages[i].content);

      const detected = detectCrop(msgText, allFileNames);
      if (detected) {
        cropFilter = detected;
        const isInherited = i !== messages.length - 1;
        console.log(`🎯 Cultivo detectado: "${cropFilter}" ${isInherited ? "(Heredado)" : ""}`);
        break;
      }
    }

    // 2. Query Rewriting: reformular la consulta para tener Conciencia de Contexto
    const searchString = await rewriteQueryWithContext(messages, cropFilter);

    // 3. Generar embedding y detectar hoja de Excel objetivo
    console.log(`🔍 Generando embedding: "${searchString}"`);
    const { vector } = await embeddingService.generateEmbedding(searchString);

    let sheetTarget: string | undefined;
    if (searchString.includes("1 Por Sem")) sheetTarget = "1 Por Sem";
    else if (searchString.includes("2 Por Sem")) sheetTarget = "2 Por Sem";
    else if (searchString.includes("3 Por Sem")) sheetTarget = "3 Por Sem";
    else if (searchString.includes("14 Dias")) sheetTarget = "14 Dias";
    else if (searchString.includes("Cal-Diario")) sheetTarget = "Cal-Diario";

    if (sheetTarget) console.log(`📋 Metadata Filter activo: hoja "${sheetTarget}"`);

    // --- 4. EXTRACCIÓN MULTI-SEMANA Y BÚSQUEDA HÍBRIDA ---
    const weeks = new Set<number>();
    const weekRegex = /(?:semana|semanas|sem)\s+([\d\s,ye]+)/gi;
    let match;
    while ((match = weekRegex.exec(searchString)) !== null) {
      const numbers = match[1].match(/\d+/g);
      if (numbers) numbers.forEach(n => weeks.add(parseInt(n, 10)));
    }
    const targetWeeks = Array.from(weeks);

    let similarChunks: any[] = [];
    if (targetWeeks.length > 1) {
      console.log(`🚀 [RAG Multi-Búsqueda] Semanas detectadas: ${targetWeeks.join(", ")}`);
      // Aseguramos al menos 2 chunks por semana (ej. 3 semanas = 6 chunks en total)
      const limitPerWeek = Math.max(2, Math.floor(6 / targetWeeks.length)); 
      const promises = targetWeeks.map(week => 
        documentRepository.findSimilarChunks(vector, limitPerWeek, 0.20, cropFilter, sheetTarget, searchString, week)
      );
      const resultsArray = await Promise.all(promises);
      const flatResults = resultsArray.flat();
      
      // Eliminar duplicados
      const uniqueIds = new Set();
      similarChunks = flatResults.filter(chunk => {
        if (uniqueIds.has(chunk.id)) return false;
        uniqueIds.add(chunk.id);
        return true;
      });
    } else {
      // Flujo tradicional (0 o 1 semana detectada)
      const singleWeek = targetWeeks.length === 1 ? targetWeeks[0] : undefined;
      similarChunks = await documentRepository.findSimilarChunks(vector, 6, 0.20, cropFilter, sheetTarget, searchString, singleWeek);
    }

    if (similarChunks.length === 0) {
      console.log("⚠️ No se encontró contexto relevante en la base de datos.");
      return { contextText: "", sources: [] };
    }

    // 5. Formatear contexto y loguear resultados
    const contextText = similarChunks
      .map((chunk, i) => `[Documento ${i + 1} (Fuente: ${chunk.fileName})]:\n${chunk.content}`)
      .join("\n\n");

    const uniqueSources = Array.from(new Set(similarChunks.map(c => c.fileName)));

    console.log(`✅ Se recuperaron ${similarChunks.length} fragmentos de contexto.`);
    similarChunks.forEach((chunk, i) => {
      const preview = chunk.content.substring(0, 150).replace(/\n/g, " ");
      // Imprimir los scores individuales si existen (para auditoría de la Búsqueda Híbrida)
      const vScore = chunk.vectorScore ? (chunk.vectorScore * 100).toFixed(1) : "?";
      const kScore = chunk.keywordScore ? chunk.keywordScore.toFixed(3) : "0";
      console.log(`[RAG Doc ${i + 1}] Hybrid: ${(chunk.similarity * 100).toFixed(1)}% (Vec: ${vScore}%, Key: ${kScore}) | Preview: "${preview}..."`);
    });
    console.log(`[RAG] Contexto inyectado: ${contextText.length} chars`);

    return { contextText, sources: uniqueSources };

  } catch (error) {
    console.error("❌ Error en el proceso RAG:", error);
    return { contextText: "", sources: [] };
  }
}
