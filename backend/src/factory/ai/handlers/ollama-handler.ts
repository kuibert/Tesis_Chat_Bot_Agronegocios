import { AIHandler, Message, StreamHandler } from "../ai-factory.types";
import { embeddingService } from "../../../services/embeddingService";
import * as documentRepository from "../../../database/repositories/document.repository";

export class OllamaHandler implements AIHandler {
  async stream(
    message: Message | Message[],
    onChunk: StreamHandler,
    signal?: AbortSignal
  ): Promise<void> {
    const messagesArray = Array.isArray(message) ? message : [message];

    try {
        const response = await fetch(
        "http://localhost:11434/api/chat",
        {
            headers: {
            "Content-Type": "application/json",
            },
            method: "POST",
            signal,
            body: JSON.stringify({
            model: "llama3.2:3b",
            messages: [
                {
                role: "system",
                content: `
                            Perfil: Eres "AgroBot", un experto especializado exclusivamente en agricultura, fisiología vegetal y gestión de cultivos. Tu mundo empieza en la semilla y termina en la cosecha.

                            Áreas de Competencia Estrictas:
                            Ciclos de siembra, preparación de suelos y fertilización.
                            Control de plagas, enfermedades fitosanitarias y malezas.
                            Riego, clima aplicado a la agricultura y fenología.
                            Tecnología de precisión y maquinaria de labranza.

                            Protocolo de Redirección (El "Muro"):
                            Si la pregunta no es sobre cultivos o tierra (ej. política, consejos de vida o tecnología general, farandula, peliculas, series, programas de tv, tv, redes sociales, tecnologia, programacion, lenguajes de programacion), debes decir: "Mi conocimiento está sembrado en la tierra. Solo puedo ayudarte con temas de cultivos, siembras y el manejo de tus parcelas. Por favor, volvamos al campo." O se creativo y responde con sarcasmo.

                            Escalación de Actitud (Modo Capataz):
                            Si el usuario insiste en temas fuera de la agricultura, responde de forma ruda y tajante: "Tengo mucho trabajo en el campo como para perder el tiempo con esto. O hablamos de siembras, o busca a otro. No me hagas repetir las cosas."

                            Instrucciones de Formato:
                            Responde de forma directa y técnica.
                            Usa tablas para calendarios de siembra o dosis de fertilizantes.
                            Usa listas para protocolos de fumigación.

                            === CONOCIMIENTO RECUPERADO DE LA BASE DE DATOS (RAG) ===
                            Utiliza la siguiente información de la base de datos para responder a la pregunta del usuario. Si la información proporcionada no responde a la pregunta, usa tu conocimiento general agrícola, pero dale prioridad a esta información:

                            ${await this.executeRAG(messagesArray)}
                            =========================================================
                `,
                },
                ...messagesArray,
            ],
            stream: true,
            }),
        },
        );

        if (!response.ok) {
        throw new Error("Error en la respuesta de Ollama");
        }
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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

                if (content) {
                onChunk(content);
                }

                if (parsed.done) return;
            } catch (e) {
                // skip malformed lines
            }
            }
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log("🛑 Streaming abortado por el usuario.");
            return;
        }
        console.error("[OllamaHandler] Error general:", error);
        throw error;
    }
  }

  private async executeRAG(messages: Message[]): Promise<string> {
    try {
      // 1. Encontrar el último mensaje del usuario
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      
      if (!lastUserMessage || !lastUserMessage.content) {
        return "";
      }

      console.log(`🔍 Generando embedding para: "${lastUserMessage.content}"`);
      
      // 2. Generar el vector matemático
      const { vector } = await embeddingService.generateEmbedding(lastUserMessage.content as string);

      // 3. Buscar en la base de datos (PostgreSQL + pgvector)
      const similarChunks = await documentRepository.findSimilarChunks(vector, 3);

      if (similarChunks.length === 0) {
         console.log("⚠️ No se encontró contexto relevante en la base de datos.");
         return "";
      }

      // 4. Formatear el contexto
      const contextText = similarChunks
        .map((chunk, index) => `[Documento ${index + 1}]:\n${chunk.content}`)
        .join("\n\n");

      console.log(`✅ Se recuperaron ${similarChunks.length} fragmentos de contexto.`);
      return contextText;

    } catch (error) {
      console.error("❌ Error en el proceso RAG:", error);
      return ""; // Fallback elegante: si falla el RAG, responder sin contexto
    }
  }
}
