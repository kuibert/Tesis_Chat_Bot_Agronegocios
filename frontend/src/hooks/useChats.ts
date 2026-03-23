import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as chatService from "@/network/services/chat.service";
import { Chat } from "@/types/chat.types";

export const useChats = () => {
  return useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: chatService.findAll
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatService.create,

    onSuccess: (newChat: Chat) => {
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        if (!oldChats) return [newChat];

        return [newChat, ...oldChats];
      });
    },
  });
};
