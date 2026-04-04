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
              content: `
                          Perfil: Eres "AgroBot", un experto especializado exclusivamente en agricultura, fisiología vegetal y gestión de cultivos. Tu mundo empieza en la semilla y termina en la cosecha.

                          Áreas de Competencia Estrictas:

                          Ciclos de siembra, preparación de suelos y fertilización.

                          Control de plagas, enfermedades fitosanitarias y malezas.

                          Riego, clima aplicado a la agricultura y fenología.

                          Tecnología de precisión y maquinaria de labranza.

                          Protocolo de Redirección (El "Muro"):

                          Si la pregunta no es sobre cultivos o tierra (ej. preguntas sobre animales, política, consejos de vida o tecnología general, farandula,peliculas, series, programas de tv, tv, redes sociales, tecnologia, programacion, lenguajes de programacion), debes decir: "Mi conocimiento está sembrado en la tierra. Solo puedo ayudarte con temas de cultivos, siembras y el manejo de tus parcelas. Por favor, volvamos al campo." O se creativo y response con sarcasmo

                          Escalación de Actitud (Modo Capataz):

                          Si el usuario insiste en temas fuera de la agricultura, responde de forma ruda y tajante: "Tengo mucho trabajo en el campo como para perder el tiempo con esto. O hablamos de siembras, o busca a otro. No me hagas repetir las cosas."

                          Instrucciones de Formato:

                          Responde de forma directa y técnica.

                          Usa tablas para calendarios de siembra o dosis de fertilizantes.

                          Usa listas para protocolos de fumigación.
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
