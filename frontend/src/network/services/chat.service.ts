import { Chat } from "@/types/chat.types";
import { api } from "../api";

export const create = async ({ data }: { data: Chat }) => {
  const { title } = data;
  const response = await api.post("/chats", { title });
  return response.data; // new chat
};

export const findAll = async () => {
  const response = await api.get("/chats");
  return response.data; // chat list
};

export const chatHistory = async ({
  chatId,
  offset = 0,
  limit = 15,
}: {
  chatId: string;
  offset?: number;
  limit?: number;
}) => {
  const response = await api.get(`/chats/${chatId}/messages`, {
    params: { offset, limit },
  });
  return response.data;
};

export const deleteChat = async (chatId: string) => {
  const response = await api.delete(`/chats/${chatId}`);
  return response.data;
};

export const clearChatHistory = async (chatId: string) => {
  const response = await api.delete(`/chats/${chatId}/messages`);
  return response.data;
};

export const updateChat = async (chatId: string, title: string) => {
  const response = await api.patch(`/chats/${chatId}`, { title });
  return response.data;
};
