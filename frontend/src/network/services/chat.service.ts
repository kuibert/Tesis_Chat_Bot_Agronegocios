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
