/**
 * ollama-handler.ts
 * Responsabilidad única: Orquestar el pipeline RAG → Prompt → LLM → Stream.
 *
 * La lógica de construcción de prompts está en:  ../utils/prompt.builder.ts
 * La lógica de conexión HTTP a Ollama está en:  ../services/ollama.client.ts
 * La lógica de parsing de área (manzanas/m²/ha) está en:  parseAreaToManzanas() (helper privado).
 */

import { AIHandler, Message, StreamHandler, MetadataHandler } from "../ai-factory.types";
import { buildAgroSystemPrompt } from "../utils/prompt.builder";
import { streamOllamaChat, chatOllamaConTools } from "../services/ollama.client";
import { executeRAG } from "../services/rag.pipeline";
import { TODOS_LOS_TOOLS } from "../tools/calcularNutrientes.tool";
import { ejecutarToolCall } from "../tools/toolDispatcher";

// ---------------------------------------------------------------------------
// UTILIDAD INTERNA: Parseo de área del usuario → manzanas
// ---------------------------------------------------------------------------

/**
 * Analiza el texto del último mensaje del usuario y normaliza cualquier
 * unidad de área a manzanas (unidad base de los manuales del MAG).
 * 1 manzana = 7,000 m² = 0.70 hectáreas.
 *
 * @returns { manzanas, textoOriginal } donde manzanas siempre es >= 0
 */
function parseAreaToManzanas(text: string): { manzanas: number; textoOriginal: string } {
  const metrosMatch = text.match(/(\d+([\.,]\d+)?)\s*(metros\s+cuadrados|m2|m²)/i);
  if (metrosMatch) {
    return {
      manzanas: parseFloat(metrosMatch[1].replace(",", ".")) / 7000,
      textoOriginal: metrosMatch[0],
    };
  }

  const haMatch = text.match(/(\d+([\.,]\d+)?)\s*(hectareas|hectáreas|ha)\b/i);
  if (haMatch) {
    return {
      manzanas: parseFloat(haMatch[1].replace(",", ".")) * (10000 / 7000),
      textoOriginal: haMatch[0],
    };
  }

  const mzMatch = text.match(/(\d+([\.,]\d+)?)\s*(manzanas|mz)\b/i);
  if (mzMatch) {
    return {
      manzanas: parseFloat(mzMatch[1].replace(",", ".")) ,
      textoOriginal: mzMatch[0],
    };
  }

  if (/media manzana/i.test(text))  return { manzanas: 0.5,  textoOriginal: "media manzana" };
  if (/cuarto de manzana/i.test(text)) return { manzanas: 0.25, textoOriginal: "cuarto de manzana" };
  if (/dos manzanas y media/i.test(text)) return { manzanas: 2.5, textoOriginal: "dos manzanas y media" };

  // Sin coincidencia → asumir 1 manzana como valor por defecto
  return { manzanas: 1, textoOriginal: "1 manzana" };
}

// ---------------------------------------------------------------------------
// HANDLER PRINCIPAL
// ---------------------------------------------------------------------------

export class OllamaHandler implements AIHandler {
  async stream(
    message: Message | Message[],
    onChunk: StreamHandler,
    signal?: AbortSignal,
    onMetadata?: MetadataHandler
  ): Promise<void> {
    const messagesArray = Array.isArray(message) ? message : [message];

    try {
      const modelName = process.env.OLLAMA_MODEL || "qwen2.5:7b";
      let metadataTool: Record<string, unknown> | null = null;
      let mensajesParaStreamFinal: Message[] = messagesArray;

      // 1. Recuperar contexto RAG
      console.time("⏱ RAG");
      const { contextText: ragContext, sources, cropFilter, targetWeeks } = await executeRAG(messagesArray);
      console.timeEnd("⏱ RAG");

      const sinContextoRAG = !ragContext || sources.length === 0;

      // 2. Extraer y normalizar el área del mensaje del usuario a manzanas
      const lastUserMessage = [...messagesArray].reverse().find(m => m.role === "user");
      const { manzanas: manzanasUsuario, textoOriginal: textoAreaOriginal } =
        lastUserMessage?.content
          ? parseAreaToManzanas(String(lastUserMessage.content))
          : { manzanas: 1, textoOriginal: "1 manzana" };

      const areaHectareasCalculada = manzanasUsuario * 0.7;

      if (sinContextoRAG) {
        console.log("⚠️ [RAG vacío] Sin contexto vectorial — intentando tool call directo...");

        const ultimoMensajeUsuario = lastUserMessage?.content ?? "";

        const promptMinimo = [
          `Eres AgroBot, asistente especializado en fertilización agrícola.`,
          `No encontraste documentos de referencia, pero tienes acceso a una base de datos`,
          `estructurada con programas de fertilización del MAG para 60 cultivos.`,
          ``,
          `Pregunta del usuario: ${ultimoMensajeUsuario}`,
          ``,
          `Área ya calculada: ${manzanasUsuario} manzanas = ${areaHectareasCalculada.toFixed(4)} hectáreas.`,
          ``,
          `REGLA: si el mensaje menciona un cultivo + área o día/etapa → invoca calcular_nutrientes.`,
          `Si no puedes responder sin documentos → dilo con honestidad, no inventes.`,
        ].join("\n");

        try {
          const decisionSinRAG = await chatOllamaConTools(
            modelName,
            promptMinimo,
            messagesArray,
            TODOS_LOS_TOOLS as any,
          );

          const toolCallsSinRAG = decisionSinRAG.message?.tool_calls;

          if (toolCallsSinRAG && toolCallsSinRAG.length > 0) {
            console.log(`[OllamaHandler] Tool call sin RAG: ${toolCallsSinRAG.map((t: any) => t.function.name).join(", ")}`);
            const resultadosSinRAG = await Promise.all(toolCallsSinRAG.map(ejecutarToolCall));
            metadataTool = { tool_calls: toolCallsSinRAG, resultados: resultadosSinRAG };
            onMetadata?.(metadataTool);

            const mensajesConResultadoSinRAG = [
              ...messagesArray,
              decisionSinRAG.message as any,
              ...resultadosSinRAG.map((resultado: unknown, i: number) => ({
                role: "tool" as const,
                content: JSON.stringify(resultado),
                name: toolCallsSinRAG[i].function.name,
              })),
            ] as any;

            const responseSinRAG = await streamOllamaChat(
              modelName,
              promptMinimo,
              mensajesConResultadoSinRAG,
              signal,
            );

            if (!responseSinRAG.ok || !responseSinRAG.body) {
              onChunk("El asistente se está reiniciando. Por favor, inténtalo de nuevo.");
              return;
            }

            await this.processStream(responseSinRAG, [], onChunk);
            return;

          } else {
            const cultivoStr = cropFilter ? `**${cropFilter}**` : "el cultivo solicitado";
            onChunk(
              `🤖 **AgroBot Informa:** No encontré información para ${cultivoStr}. ` +
              `Si buscas una dosis exacta, incluye el nombre del cultivo, el área y el día del ciclo. ` +
              `Para preguntas generales, intenta reformularla.`
            );
            return;
          }
        } catch (toolErrorSinRAG) {
          console.error("[OllamaHandler] Error en tool call sin RAG:", toolErrorSinRAG);
          const cultivoStr = cropFilter ? `**${cropFilter}**` : "el cultivo solicitado";
          onChunk(
            `🤖 **AgroBot Informa:** No encontré datos disponibles para ${cultivoStr}. ` +
            `Por favor, verifica el nombre del cultivo o consulta con un agrónomo.`
          );
          return;
        }
      }

      // 2. Construir system prompt usando el módulo dedicado y la matemática en TS
      const systemPrompt = buildAgroSystemPrompt(ragContext, manzanasUsuario, textoAreaOriginal);

      // 2.5 Fase de decisión: ¿la pregunta requiere un cálculo exacto de fertilizante?
      // Reutiliza el área ya calculada arriba (manzanasUsuario) — no se le pide al LLM
      // que vuelva a convertir unidades, solo que decida SI necesita calcular una dosis.

      // Prompt dedicado SOLO a la fase de decisión — NO incluye systemPrompt completo.
      // El systemPrompt (con instrucciones de generar tabla) se usa solo en la Fase 2.
      const promptDecision = [
        `Eres AgroBot, asistente agrícola. Tu única tarea ahora es decidir si invocar la herramienta calcular_nutrientes.`,
        ``,
        `REGLA: si el mensaje menciona un cultivo + un área (manzanas, hectáreas, m²) + un día o etapa,`,
        `DEBES invocar calcular_nutrientes. No respondas con texto — solo decide si usar el tool.`,
        ``,
        `Dato ya calculado: el usuario mencionó ${manzanasUsuario} manzanas = ${areaHectareasCalculada.toFixed(4)} hectáreas.`,
        `Usa ese valor exacto para areaHectareas al invocar la tool.`,
        ``,
        `Si la pregunta NO pide una dosis o cálculo (es abierta, sobre síntomas, manejo general, etc.),`,
        `NO invoques el tool. Simplemente responde con content vacío y sin tool_calls.`,
      ].join("\n");

      try {
        console.time("⏱ Fase 1 (decisión + tool)");
        const decision = await chatOllamaConTools(modelName, promptDecision, messagesArray, TODOS_LOS_TOOLS as any);
        console.timeEnd("⏱ Fase 1 (decisión + tool)");
        const toolCalls = decision.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          console.log(`[OllamaHandler] Tool call detectado: ${toolCalls.map((t: any) => t.function?.name ?? t.name).join(", ")}`);
          console.time("⏱ Ejecución del tool");
          const resultados = await Promise.all(toolCalls.map(ejecutarToolCall));
          console.timeEnd("⏱ Ejecución del tool");
          metadataTool = { tool_calls: toolCalls, resultados };

          mensajesParaStreamFinal = [
            ...messagesArray,
            decision.message as any,
            ...resultados.map((resultado: unknown, i: number) => ({
              role: "tool" as const,
              content: JSON.stringify(resultado),
              name: toolCalls[i].function?.name ?? toolCalls[i].name,
            })),
          ] as any;
        }
      } catch (toolError) {
        // Si la fase de tools falla, NO se rompe la conversación — sigue el flujo normal de RAG
        console.error("[OllamaHandler] Error en fase de tools, se continúa sin cálculo exacto:", toolError);
      }

      // 3. Auditoría de tamaño de contexto
      let totalChars = systemPrompt.length;
      for (const msg of mensajesParaStreamFinal) {
        totalChars += msg.content ? String(msg.content).length : 0;
      }
      const estimatedTokens = Math.ceil(totalChars / 4);
      console.log(`[AUDITORIA] Modelo: ${modelName}`);
      console.log(`[AUDITORIA] System Prompt + RAG: ${systemPrompt.length} chars`);
      console.log(`[AUDITORIA] Total prompt: ${totalChars} chars (~${estimatedTokens} tokens)`);

      // 4. Llamar a Ollama en modo streaming usando el cliente dedicado
      console.time("⏱ Fase 2 (respuesta final, hasta primer byte)");
      const response = await streamOllamaChat(modelName, systemPrompt, mensajesParaStreamFinal, signal);
      console.timeEnd("⏱ Fase 2 (respuesta final, hasta primer byte)");

      if (!response.ok) {
        onChunk("El asistente se está reiniciando. Por favor, inténtalo de nuevo en unos segundos.");
        console.error(`[OllamaHandler] Respuesta no OK: ${response.status}`);
        return;
      }
      if (!response.body) return;

      if (metadataTool) {
        console.log("[OllamaHandler] Invocando onMetadata con:", JSON.stringify(metadataTool));
        onMetadata?.(metadataTool);
      } else {
        console.log("[OllamaHandler] metadataTool es null (no hubo tool_call o la fase de tools falló)");
      }

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
