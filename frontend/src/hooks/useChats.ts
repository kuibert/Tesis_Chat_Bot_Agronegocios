import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import * as chatService from "@/network/services/chat.service";
import { Chat } from "@/types/chat.types";

export const useChats = ({ enabled }: { enabled?: boolean } = {}) => {
  return useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: chatService.findAll,
    enabled: enabled,
    staleTime: 1000 * 60 * 5,
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

export const useChatHistory = (chatId: string) => {
  return useInfiniteQuery({
    queryKey: ["chats", chatId, "messages"],
    queryFn: ({ pageParam = 0 }) =>
      chatService.chatHistory({ chatId, offset: pageParam, limit: 15 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextOffset
        : undefined;
    },
    enabled: !!chatId,
  });
};
 