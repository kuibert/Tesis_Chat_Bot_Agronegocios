import { AIHandler, Message, StreamHandler } from "../ai-factory.types";

export class OllamaHandler implements AIHandler {
  async stream(
    message: Message | Message[],
    onChunk: StreamHandler,
  ): Promise<void> {
    const messagesArray = Array.isArray(message) ? message : [message];

    const response = await fetch(
      "http://localhost:12434/engines/llama.cpp/v1/chat/completions",
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          model: "ai/qwen3:0.6B-Q4_0",
          messages: [
            {
              role: "system",
              content:
                "Erres un asistente de ia, para un sistema rag asociado al agro",
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

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.replace("data: ", "");

        if (jsonStr === "[DONE]") return;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;

          if (content) {
            onChunk(content);
          }
        } catch (e) {
          throw e;
        }
      }
    }
  }
}
