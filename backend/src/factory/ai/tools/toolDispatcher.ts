// backend/src/factory/ai/tools/toolDispatcher.ts
//
// Une el nombre del tool (como lo devuelve Ollama) con la función real que lo ejecuta.
// Agregar un tool nuevo en el futuro = una línea aquí + su definición de schema.

import { calcularNutrientes } from "../services/calcularNutrientesService";

type ToolCallOllama = {
  function: {
    name: string;
    arguments: Record<string, unknown> | string;
  };
};

const registroDeTools: Record<string, (args: any) => Promise<unknown>> = {
  calcular_nutrientes: (args) => calcularNutrientes(args),
};

export async function ejecutarToolCall(toolCall: ToolCallOllama): Promise<unknown> {
  const nombre = toolCall.function.name;
  const fn = registroDeTools[nombre];

  if (!fn) {
    return { error: `Tool desconocida: "${nombre}"` };
  }

  const args =
    typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

  try {
    return await fn(args);
  } catch (e) {
    // Nunca dejar que un error de la tool tumbe la conversación —
    // se le devuelve el error al LLM como resultado, para que lo comunique con honestidad
    return { error: e instanceof Error ? e.message : "Error desconocido ejecutando el cálculo" };
  }
}
