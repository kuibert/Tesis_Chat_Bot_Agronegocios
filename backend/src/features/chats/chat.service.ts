import * as chatRepository from "../../database/repositories/chat.repository";
import { Chat } from "./chat.type";

export const findBySessionId = async (sessionId: string) => {
  const chats = await chatRepository.findByUserId(sessionId);
  return chats;
};

export const create = async ({ data }: { data: Chat }) => {
  const chat = await chatRepository.create({
    data: {
      ...data,
    },
  });

  return chat;
};

export const getChatHistory = async (
  chatId: string,
  limit = 50,
  offset = 0,
) => {
  const [data, total] = await Promise.all([
    chatRepository.findMessageByChatId(chatId, limit, offset),
    chatRepository.countMessageByChatId(chatId),
  ]);

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      nextOffset: offset + limit < total ? offset + limit : null,
    },
  };
};

export const deleteChat = async (chatId: string) => {
  await chatRepository.deleteChat(chatId);
};

export const clearChatHistory = async (chatId: string) => {
  await chatRepository.deleteAllMessagesByChatId(chatId);
};

export const renameChat = async (chatId: string, title: string) => {
  return await chatRepository.renameChat(chatId, title);
};
