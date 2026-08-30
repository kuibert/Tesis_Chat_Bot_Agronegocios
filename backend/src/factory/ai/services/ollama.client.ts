/**
 * ollama.client.ts
 * Responsabilidad única: Comunicarse con la API HTTP de Ollama local.
 *
 * Centraliza todos los parámetros de inferencia (temperatura, top_p, etc.)
 * para evitar alucinaciones y asegurar respuestas deterministas.
 */

import { Message } from "../ai-factory.types";

/** Parámetros de inferencia para controlar el comportamiento del modelo */
interface OllamaInferenceOptions {
  temperature?: number;  // 0.0 = determinista, 1.0 = muy creativo
  top_p?: number;        // Nucleus sampling: reduce vocabulario activo
  top_k?: number;        // Limita tokens candidatos en cada paso
  num_predict?: number;  // Máximo de tokens a generar (-1 = sin límite)
}

const DEFAULT_OPTIONS: OllamaInferenceOptions = {
  temperature: 0.1,   // Casi determinista: respuestas fieles al contexto RAG
  top_p: 0.9,          // Solo el 90% superior de probabilidad acumulada
  top_k: 40,           // Máximo 40 tokens candidatos por paso
};

const OLLAMA_BASE_URL = "http://localhost:11434";

/**
 * Realiza una llamada de chat en modo streaming a la API de Ollama.
 * Retorna el ReadableBody para que el handler lo procese token a token.
 */
export async function streamOllamaChat(
  model: string,
  systemPrompt: string,
  messages: Message[],
  signal?: AbortSignal,
  options: OllamaInferenceOptions = {}
): Promise<Response> {
  const fullTextToInspect = (systemPrompt + " " + messages.map(m => m.content).join(" ")).toLowerCase();
  const isDosificationQuery = ["map_lbs", "insumos_dosis", "dosis", "semana", "libras", "gramos", "kg", "aplicar"].some(term => fullTextToInspect.includes(term));

  const dynamicOptions: OllamaInferenceOptions = isDosificationQuery
    ? { temperature: 0.0 }
    : {};

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options, ...dynamicOptions };

  return fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      options: {
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.top_p,
        top_k: mergedOptions.top_k,
        num_predict: mergedOptions.num_predict ?? -1,
      },
    }),
  });
}

/**
 * Realiza una llamada de chat sin streaming (para el Query Rewriter).
 * Retorna la respuesta completa del mensaje como string.
 */
export async function chatOllama(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: OllamaInferenceOptions = {}
): Promise<string> {
  // El Query Rewriter debe ser 100% determinista (temperatura 0)
  const rewriterOptions: OllamaInferenceOptions = {
    temperature: 0,
    top_p: 1.0,
    top_k: 1,
    ...options,
  };

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      options: {
        temperature: rewriterOptions.temperature,
        top_p: rewriterOptions.top_p,
        top_k: rewriterOptions.top_k,
        num_predict: rewriterOptions.num_predict ?? 200, // El rewriter no necesita respuestas largas
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama respondió con error ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content?.trim() ?? "";
}
