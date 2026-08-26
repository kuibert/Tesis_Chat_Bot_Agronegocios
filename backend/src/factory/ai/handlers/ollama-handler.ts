/**
 * ollama-handler.ts
 * Responsabilidad única: Orquestar el pipeline RAG → Prompt → LLM → Stream.
 *
 * La lógica de construcción de prompts está en:  ../utils/prompt.builder.ts
 * La lógica de conexión HTTP a Ollama está en:  ../services/ollama.client.ts
 * La lógica de fuzzy matching de cultivos está aquí (utilidad interna del handler).
 */

import { AIHandler, Message, StreamHandler } from "../ai-factory.types";
import { embeddingService } from "../../../services/embeddingService";
import * as documentRepository from "../../../database/repositories/document.repository";
import { buildAgroSystemPrompt } from "../utils/prompt.builder";
import { streamOllamaChat, chatOllama } from "../services/ollama.client";

import { rewriteQueryWithContext } from "../services/context.manager";

// ---------------------------------------------------------------------------
// UTILIDADES PARA FUZZY MATCHING DE CULTIVOS
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitución
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // inserción/eliminación
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Extrae el nombre limpio del cultivo a partir del nombre del archivo Excel.
 */
function extractCropName(fileName: string): string {
  let name = fileName.replace(/\.[^/.]+$/, "");
  const cutSuffixes = [
    "_MCA-EDA", "_Fert", "_Año", "_Años", "_50-Ton", "_Menos", 
    "_Plantilla", "_Vivero", "_Segundo", "_Mensual", "_Req",
    "_3000-Gavetas", "_4000-Gavetas", "_4000_Gavetas", "_Gavetas"
  ];
  for (const suffix of cutSuffixes) {
    const idx = name.indexOf(suffix);
    if (idx !== -1) {
      name = name.substring(0, idx);
    }
  }
  return name.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Detecta el cultivo en la consulta del usuario de forma robusta e insensible a typos
 * priorizando coincidencia de frase exacta y previniendo colisiones (ej. chive vs chile dulce).
 */
function detectCrop(query: string, allFileNames: string[]): string | null {
  const normalizedQuery = normalizeText(query);
  const cropMap = new Map<string, string>(); // normalizedCleanCrop -> originalPrefix

  for (const fileName of allFileNames) {
    const clean = extractCropName(fileName);
    const normalizedClean = normalizeText(clean);
    
    // Extraer prefijo original con guiones bajos para el filtro SQL (ej: "chile_dulce")
    let originalPrefix = fileName.replace(/\.[^/.]+$/, "");
    const cutSuffixes = [
      "_MCA-EDA", "_Fert", "_Año", "_Años", "_50-Ton", "_Menos", 
      "_Plantilla", "_Vivero", "_Segundo", "_Mensual", "_Req",
      "_3000-Gavetas", "_4000-Gavetas", "_4000_Gavetas", "_Gavetas"
    ];
    for (const suffix of cutSuffixes) {
      const idx = originalPrefix.indexOf(suffix);
      if (idx !== -1) {
        originalPrefix = originalPrefix.substring(0, idx);
      }
    }

    if (normalizedClean.length > 2) {
      cropMap.set(normalizedClean, originalPrefix.toLowerCase());
    }
  }

  const crops = Array.from(cropMap.keys());

  // 1. Buscar coincidencia de frase exacta (de mayor a menor longitud)
  const sortedCrops = [...crops].sort((a, b) => b.length - a.length);
  for (const crop of sortedCrops) {
    if (normalizedQuery.includes(crop)) {
      return cropMap.get(crop) || null;
    }
  }

  // 2. Buscar si todas las palabras del cultivo están presentes en la consulta
  let bestMatch: string | null = null;
  let maxWords = 0;
  for (const crop of crops) {
    const words = crop.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const allPresent = words.every(word => normalizedQuery.includes(word));
    if (allPresent && words.length > maxWords) {
      bestMatch = crop;
      maxWords = words.length;
    }
  }

  if (bestMatch) {
    return cropMap.get(bestMatch) || null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// HANDLER PRINCIPAL
// ---------------------------------------------------------------------------

export class OllamaHandler implements AIHandler {
  async stream(
    message: Message | Message[],
    onChunk: StreamHandler,
    signal?: AbortSignal
  ): Promise<void> {
    const messagesArray = Array.isArray(message) ? message : [message];

    try {
      const modelName = process.env.OLLAMA_MODEL || "qwen2.5:7b";

      // 1. Recuperar contexto RAG
      const { contextText: ragContext, sources } = await this.executeRAG(messagesArray);

      // 2. Construir system prompt usando el módulo dedicado
      const systemPrompt = buildAgroSystemPrompt(ragContext);

      // 3. Auditoría de tamaño de contexto
      let totalChars = systemPrompt.length;
      for (const msg of messagesArray) {
        totalChars += msg.content ? String(msg.content).length : 0;
      }
      const estimatedTokens = Math.ceil(totalChars / 4);
      console.log(`[AUDITORIA] Modelo: ${modelName}`);
      console.log(`[AUDITORIA] System Prompt + RAG: ${systemPrompt.length} chars`);
      console.log(`[AUDITORIA] Total prompt: ${totalChars} chars (~${estimatedTokens} tokens)`);

      // 4. Llamar a Ollama en modo streaming usando el cliente dedicado
      const response = await streamOllamaChat(modelName, systemPrompt, messagesArray, signal);

      if (!response.ok) {
        onChunk("El asistente se está reiniciando. Por favor, inténtalo de nuevo en unos segundos.");
        console.error(`[OllamaHandler] Respuesta no OK: ${response.status}`);
        return;
      }
      if (!response.body) return;

      // 5. Procesar el stream con ventana deslizante anti-alucinación de fuentes
      await this.processStream(response, sources, onChunk);

    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("🛑 Streaming abortado por el usuario.");
        return;
      }
      console.error("[OllamaHandler] Error general:", error);
      onChunk("El asistente se está reiniciando. Por favor, inténtalo de nuevo en unos segundos.");
    }
  }

  /**
   * Procesa el stream de Ollama token a token.
   * Usa una ventana deslizante para interceptar y eliminar alucinaciones de "Fuentes consultadas".
   * Al final inyecta las fuentes reales provenientes de pgvector.
   */
  private async processStream(
    response: Response,
    sources: string[],
    onChunk: StreamHandler
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    let pendingWindow = "";
    let isHallucinatingSources = false;

    const hallucinationRegex = /(?:\n\s*(?:📚\s*)?(?:Fuentes consultadas|Fuentes|Bibliografía):)/i;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const content = parsed.message?.content;

          if (content && !isHallucinatingSources) {
            fullResponse += content;
            pendingWindow += content;

            if (hallucinationRegex.test(fullResponse)) {
              isHallucinatingSources = true;
              pendingWindow = "";
            } else if (pendingWindow.length > 35) {
              const toEmit = pendingWindow.substring(0, pendingWindow.length - 35);
              pendingWindow = pendingWindow.substring(pendingWindow.length - 35);
              onChunk(toEmit);
            }
          }

          if (parsed.done) {
            // Vaciar ventana residual
            if (pendingWindow.length > 0 && !isHallucinatingSources) {
              if (!hallucinationRegex.test(pendingWindow)) {
                onChunk(pendingWindow.trimEnd());
              }
            }

            // Añadir fuentes reales de pgvector al final
            if (sources.length > 0) {
              const sourcesMarkdown = `\n\n---\n**📚 Fuentes consultadas:**\n${sources.map(s => `- 📄 ${s}`).join("\n")}`;
              onChunk(sourcesMarkdown);
            }
            return;
          }
        } catch {
          // Ignorar líneas malformadas del stream
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PIPELINE RAG
  // ---------------------------------------------------------------------------

  private async executeRAG(messages: Message[]): Promise<{ contextText: string; sources: string[] }> {
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

      // 4. Búsqueda semántica (Híbrida) en pgvector
      const similarChunks = await documentRepository.findSimilarChunks(vector, 6, 0.20, cropFilter, sheetTarget, searchString);

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
}
