import { api } from "../api";

export const create = async ({ data }: { data: { title: string } }) => { 
  const response = await api.post("/chats", { ...data });
  return response.data; // new chat
};

export const findAll = async () => {
  const response = await api.get("/chats");
  return response.data; // chat list
};
