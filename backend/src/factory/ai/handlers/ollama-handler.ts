/**
 * ollama-handler.ts
 * Responsabilidad única: Orquestar el pipeline RAG → Prompt → LLM → Stream.
 *
 * La lógica de construcción de prompts está en:  ../utils/prompt.builder.ts
 * La lógica de conexión HTTP a Ollama está en:  ../services/ollama.client.ts
 * La lógica de fuzzy matching de cultivos está aquí (utilidad interna del handler).
 */

import { AIHandler, Message, StreamHandler } from "../ai-factory.types";
import { buildAgroSystemPrompt } from "../utils/prompt.builder";
import { streamOllamaChat } from "../services/ollama.client";
import { executeRAG } from "../services/rag.pipeline";

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
      const { contextText: ragContext, sources } = await executeRAG(messagesArray);

      // --- EXTRAER MANZANAS DEL USUARIO PARA CÁLCULO EN TYPESCRIPT ---
      let manzanasUsuario = 1;
      let textoAreaOriginal = "1 manzana";
      const lastUserMessage = [...messagesArray].reverse().find(m => m.role === "user");
      
      if (lastUserMessage && lastUserMessage.content) {
        const text = String(lastUserMessage.content);
        
        const metrosMatch = text.match(/(\d+([\.,]\d+)?)\s*(metros\s+cuadrados|m2|m²)/i);
        if (metrosMatch) {
          manzanasUsuario = parseFloat(metrosMatch[1].replace(",", ".")) / 7000;
          textoAreaOriginal = metrosMatch[0];
        } else {
          const haMatch = text.match(/(\d+([\.,]\d+)?)\s*(hectareas|hectáreas|ha)\b/i);
          if (haMatch) {
            manzanasUsuario = parseFloat(haMatch[1].replace(",", ".")) * (10000 / 7000);
            textoAreaOriginal = haMatch[0];
          } else {
            const mzMatch = text.match(/(\d+([\.,]\d+)?)\s*(manzanas|mz)\b/i);
            if (mzMatch) {
              manzanasUsuario = parseFloat(mzMatch[1].replace(",", "."));
              textoAreaOriginal = mzMatch[0];
            } else if (text.match(/media manzana/i)) {
              manzanasUsuario = 0.5;
              textoAreaOriginal = "media manzana";
            } else if (text.match(/cuarto de manzana/i)) {
              manzanasUsuario = 0.25;
              textoAreaOriginal = "cuarto de manzana";
            } else if (text.match(/dos manzanas y media/i)) {
              manzanasUsuario = 2.5;
              textoAreaOriginal = "dos manzanas y media";
            }
          }
        }
      }

      // 2. Construir system prompt usando el módulo dedicado y la matemática en TS
      const systemPrompt = buildAgroSystemPrompt(ragContext, manzanasUsuario, textoAreaOriginal);

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
      require('fs').writeFileSync('prompt_sent.txt', systemPrompt + '\n\n' + JSON.stringify(messagesArray, null, 2));
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


}
