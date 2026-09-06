// backend/src/factory/ai/tools/calcularNutrientes.tool.ts
//
// Definición del tool en formato Ollama/OpenAI function-calling.
// qwen2.5 lo soporta nativamente vía /api/chat con "tools" en el body.

export const calcularNutrientesTool = {
  type: "function",
  function: {
    name: "calcular_nutrientes",
    description:
      "Calcula la cantidad EXACTA de fertilizante (en libras/gramos) que necesita un cultivo " +
      "específico, dado el área del terreno, el día del ciclo y el período de tiempo. Úsala " +
      "SIEMPRE que el usuario pida una dosis, cantidad, o cálculo de fertilización — nunca " +
      "calcules estos números tú mismo. " +
      "IMPORTANTE: si el usuario no mencionó el día del ciclo o la etapa de su cultivo, NO " +
      "llames a esta tool todavía y NO respondas con información genérica — primero pregúntale " +
      "en qué día después de siembra/trasplante está su cultivo, o en qué etapa aproximada " +
      "(ej. 'recién sembrado', 'floración', 'a mitad de ciclo'). Una vez lo sepas, conviértelo a " +
      "un número de día aproximado y llama a la tool. " +
      "Si el resultado indica ambigüedad ('ambiguo'), presenta las opciones al usuario y pide que " +
      "elija una especificando su fuenteArchivo en la siguiente llamada. Si indica 'no_encontrado', " +
      "dilo con honestidad, no inventes un número. Incluye siempre cualquier advertencia del " +
      "resultado en tu respuesta.",
    parameters: {
      type: "object",
      properties: {
        cultivo: {
          type: "string",
          description: "Nombre del cultivo mencionado por el usuario, ej. 'Tomate', 'Piña', 'Café'",
        },
        areaHectareas: {
          type: "number",
          description: "Área del terreno en hectáreas. Si el usuario da manzanas, convierte: 1 manzana ≈ 0.7 hectáreas",
        },
        diaDespuesSiembra: {
          type: "integer",
          description: "Día del ciclo del cultivo (días después de siembra o trasplante). Si el usuario no lo sabe, pregunta o usa la semana aproximada del cultivo × 7",
        },
        diasDelPeriodo: {
          type: "integer",
          description: "Días que cubre el cálculo: usa 7 para 'esta semana' (default si no se especifica), 14 para quincenal, 1 para un solo día.",
        },
        tipoRiegoSolicitado: {
          type: "string",
          description: "Tipo de riego que usa el agricultor, si lo menciona (ej. 'goteo', 'gravedad'). Opcional.",
        },
        fuenteArchivo: {
          type: "string",
          description: "SOLO se incluye cuando el usuario ya eligió una opción específica de una respuesta ambigua anterior — el identificador de archivo que se le mostró.",
        },
      },
      required: ["cultivo", "areaHectareas", "diaDespuesSiembra"],
    },
  },
} as const;

export const TODOS_LOS_TOOLS = [calcularNutrientesTool];
