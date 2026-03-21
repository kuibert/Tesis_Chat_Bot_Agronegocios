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
