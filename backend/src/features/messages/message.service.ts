import { Message } from "../../factory/ai/ai-factory.types";
import { AIProviderFactory } from "../../factory/ai/ai-factory";

import * as chatRepository from "../../database/repositories/chat.repository";
import { calcularNutrientes } from "../../factory/ai/services/calcularNutrientesService";
import { streamOllamaChat } from "../../factory/ai/services/ollama.client";
const GHOST_CHAT_ID = `no-memory-session`;

const aiProvider = AIProviderFactory.create("ollama");

export const saveMessage = async (
  data: { chatId: string; content: string },
  onListen: (msg: any) => void,
  onStream: (chunk: string, messageId: string) => void,
  signal?: AbortSignal
): Promise<{ messageId: string; metadata?: Record<string, unknown> }> => {
  const { content, chatId } = data;

  if (!chatId) throw Error("The chat id is required.");

  const { userMsg, assistantMsg } = await chatRepository.transaction(
    async (tx) => {
      const userMsg = await chatRepository.saveMessage(
        { chatId, role: "user", content },
        tx,
      );

      const assistantMsg = await chatRepository.saveMessage(
        { chatId, role: "assistant", content: "" },
        tx,
      );

      return { userMsg, assistantMsg };
    },
  );

  onListen(userMsg);
  onListen(assistantMsg);

  let fullResponse = "";
  let metadataTool: Record<string, unknown> | undefined;
  
  // 1. Recuperar últimos 15 mensajes del historial
  const historyRaw = await chatRepository.findMessageByChatId(chatId, 15);

  // 2. Limpiar y ordenar cronológicamente
  const payload: Message[] = historyRaw
    .filter((msg) => msg.id !== assistantMsg.id) // Ocultar el mensaje en blanco actual
    .filter((msg) => (msg.metadata as any)?.tipo_mensaje !== "calculo_directo") // Excluir par de desambiguación del RAG
    .reverse() // De más antiguo a más reciente
    .map((msg) => ({
      content: msg.role === "assistant"
        ? msg.content.slice(0, 300) // truncar respuestas largas del asistente
        : msg.content,
      role: msg.role as "user" | "assistant",
    }));

  await aiProvider.stream(
    payload,
    (chunk) => {
      fullResponse += chunk;
      onStream(chunk, assistantMsg.id);
    },
    signal,
    (metadata) => {
      metadataTool = metadata; // se llena solo si el handler ejecutó un tool call
    },
  );

  await chatRepository.updateMessage({
    messageId: assistantMsg.id,
    content: fullResponse,
    metadata: metadataTool,
  });

  return { messageId: assistantMsg.id, metadata: metadataTool };
};

export const noMemoryMessage = async (
  data: { content: string },
  onListen: (msg: any) => void,
  onStream: (chunk: string, messageId: string) => void,
  signal?: AbortSignal
): Promise<{ messageId: string; metadata?: Record<string, unknown> }> => {
  const { content } = data;

  const userMsg = {
    id: crypto.randomUUID(),
    chatId: GHOST_CHAT_ID,
    role: "user",
    content,
    createdAt: new Date(),
  };

  const assistantMsg = {
    id: crypto.randomUUID(),
    chatId: GHOST_CHAT_ID,
    role: "assistant",
    content: "",
    createdAt: new Date(),
  };

  onListen(userMsg);
  onListen(assistantMsg);

  let fullResponse = "";
  let metadataTool: Record<string, unknown> | undefined;
  const payload: Message = { content, role: "user" };

  await aiProvider.stream(
    payload,
    (chunk) => {
      fullResponse += chunk;
      onStream(chunk, assistantMsg.id);
    },
    signal,
    (metadata) => {
      metadataTool = metadata;
    }
  );

  return { messageId: assistantMsg.id, metadata: metadataTool };
};

export const calculateDirect = async (
  data: {
    chatId: string;
    content: string;
    toolParams: {
      cultivo: string;
      fuenteArchivo: string | null;
      areaHectareas: number;
      diaDespuesSiembra: number;
      diasDelPeriodo: number;
    };
  },
  onListen: (msg: any) => void,
  onStream: (chunk: string, messageId: string) => void,
  signal?: AbortSignal,
): Promise<{ messageId: string; metadata?: Record<string, unknown> }> => {
  const { chatId, content, toolParams } = data;

  const isNoMemory = chatId === GHOST_CHAT_ID;

  let userMsg: any;
  let assistantMsg: any;

  if (isNoMemory) {
    userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    assistantMsg = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
  } else {
    const txRes = await chatRepository.transaction(async (tx) => {
      const u = await chatRepository.saveMessage({ chatId, role: "user", content }, tx);
      const a = await chatRepository.saveMessage({ chatId, role: "assistant", content: "" }, tx);
      return { userMsg: u, assistantMsg: a };
    });
    userMsg = txRes.userMsg;
    assistantMsg = txRes.assistantMsg;
  }

  onListen(userMsg);
  onListen(assistantMsg);

  // Ejecutar el motor directamente, sin pasar por el LLM para extraer parámetros
  const resultado = await calcularNutrientes({
    cultivo: toolParams.cultivo,
    fuenteArchivo: toolParams.fuenteArchivo ?? undefined,
    areaHectareas: toolParams.areaHectareas,
    diaDespuesSiembra: toolParams.diaDespuesSiembra,
    diasDelPeriodo: toolParams.diasDelPeriodo,
  });

  const metadataTool = {
    tool_calls: [{ function: { name: "calcular_nutrientes", arguments: toolParams } }],
    resultados: [resultado],
  };

  // Generar respuesta narrativa con el resultado ya disponible (sin RAG ni tool-calling)
  let fullResponse = "";
  const promptNarracion = [
    `Eres AgroBot. El motor de cálculo ya ejecutó el cálculo y te dio este resultado exacto:`,
    ``,
    JSON.stringify(resultado, null, 2),
    ``,
    `Contexto de la etapa: el cultivo está en el día ${toolParams.diaDespuesSiembra} después de siembra.`,
    `Ajusta tu explicación agronómica a lo que ocurre específicamente en esa etapa del ciclo.`,
    ``,
    `Tu única tarea es presentar estos datos al usuario en español de forma clara.`,
    `NO llames ninguna herramienta. NO calcules nada. Solo presenta los datos que ya tienes.`,
    `Formato: explica brevemente POR QUÉ se recomiendan estos productos para esta etapa del cultivo ` +
    `(su función agronómica, no sus cantidades — esas ya las ve el usuario en una tabla separada). ` +
    `NO listes las cantidades numéricas — ya están mostradas. ` +
    `NO repitas las advertencias del campo "advertencias" — ya aparecen debajo de la tabla. ` +
    `Sé conciso: 3-4 oraciones máximo.`,
  ].join("\n");

  const modelName = process.env.OLLAMA_MODEL || "qwen2.5:7b";

  const responseNarracion = await streamOllamaChat(
    modelName,
    promptNarracion,
    [{ role: "user", content: "Presenta el resultado del cálculo." }],
    signal,
  );

  if (responseNarracion.ok && responseNarracion.body) {
    const reader = responseNarracion.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line.trim());
          const content = parsed.message?.content;
          if (content) {
            fullResponse += content;
            onStream(content, assistantMsg.id);
          }
        } catch { /* ignorar líneas malformadas */ }
      }
    }
  }

  if (!isNoMemory) {
    // Marcar el mensaje del usuario con tipo_mensaje para excluirlo del historial RAG
    await chatRepository.updateMessage({
      messageId: userMsg.id,
      content: userMsg.content,
      metadata: { tipo_mensaje: "calculo_directo" },
    });
    // Marcar también la narración del asistente para excluirla del RAG
    await chatRepository.updateMessage({
      messageId: assistantMsg.id,
      content: fullResponse,
      metadata: {
        ...metadataTool,
        tipo_mensaje: "calculo_directo",
      },
    });
  }

  return { messageId: assistantMsg.id, metadata: metadataTool };
};

