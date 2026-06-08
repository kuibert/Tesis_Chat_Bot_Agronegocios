import { Message } from "../../factory/ai/ai-factory.types";
import { AIProviderFactory } from "../../factory/ai/ai-factory";

import * as chatRepository from "../../database/repositories/chat.repository";
const GHOST_CHAT_ID = `no-memory-session`;

const aiProvider = AIProviderFactory.create("ollama");

export const saveMessage = async (
  data: { chatId: string; content: string },
  onListen: (msg: any) => void,
  onStream: (chunk: string, messageId: string) => void,
  signal?: AbortSignal
) => {
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
  
  // 1. Recuperar últimos 15 mensajes del historial
  const historyRaw = await chatRepository.findMessageByChatId(chatId, 15);

  // 2. Limpiar y ordenar cronológicamente
  const payload: Message[] = historyRaw
    .filter((msg) => msg.id !== assistantMsg.id) // Ocultar el mensaje en blanco actual
    .reverse() // De más antiguo a más reciente
    .map((msg) => ({
      content: msg.content,
      role: msg.role as "user" | "assistant",
    }));

  await aiProvider.stream(payload, (chunk) => {
    fullResponse += chunk;
    onStream(chunk, assistantMsg.id);
  }, signal);

  await chatRepository.updateMessage({
    messageId: assistantMsg.id,
    content: fullResponse,
  });
};

export const noMemoryMessage = async (
  data: { content: string },
  onListen: (msg: any) => void,
  onStream: (chunk: string, messageId: string) => void,
  signal?: AbortSignal
) => {
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
  const payload: Message = { content, role: "user" };

  await aiProvider.stream(payload, (chunk) => {
    fullResponse += chunk;
    onStream(chunk, assistantMsg.id);
  }, signal);
};
