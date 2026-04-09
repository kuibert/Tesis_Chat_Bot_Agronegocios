import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  QueryClient,
} from "@tanstack/react-query";
import * as chatService from "@/network/services/chat.service";
import { Chat } from "@/types/chat.types";

export const useGetChats = ({ enabled }: { enabled?: boolean } = {}) => {
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

export const useQueryHistoryChat = (
  chatId: string,
  opt: { hasMemory?: boolean },
) => {
  return useInfiniteQuery({
    queryKey: ["chats", chatId, "messages"],
    queryFn: ({ pageParam = 0 }) =>
      chatService.chatHistory({ chatId, offset: pageParam, limit: 15 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasMore
        ? lastPage.pagination.nextOffset
        : undefined;
    },
    enabled: !!chatId && opt.hasMemory,
  });
};

// export const useChatHistory = (chatId: string) => {
//   return useInfiniteQuery({
//     queryKey: ["chats", chatId, "messages"],
//     queryFn: ({ pageParam = 0 }) =>
//       chatService.chatHistory({ chatId, offset: pageParam, limit: 15 }),
//     initialPageParam: 0,
//     getNextPageParam: (lastPage) => {
//       return lastPage.pagination.hasMore
//         ? lastPage.pagination.nextOffset
//         : undefined;
//     },
//     enabled: !!chatId,
//   });
// };

// export const useChatStatus = (chatId?: string) => {
//   const queryClient = useQueryClient();

export const useQueryStatusChat = (chatId?: string) => {
  const queryClient = useQueryClient();

  const generatingKey = ["chats", chatId, "isGenerating"];
  const startedKey = ["chats", chatId, "hasStarted"];

  const { data: isGenerating } = useQuery({
    queryKey: generatingKey,
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });

  const { data: hasStarted } = useQuery({
    queryKey: startedKey,
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });

  return {
    isGenerating,
    hasStarted,

    setIsGenerating: (value: boolean) => {
      queryClient.setQueryData(generatingKey, value);
    },

    setHasStarted: (value: boolean) => {
      queryClient.setQueryData(startedKey, value);
    },

    resetStatus: () => {
      queryClient.setQueryData(generatingKey, false);
      queryClient.setQueryData(startedKey, false);
    },
  };
};

export const setQueryDataChat = (
  queryClient: QueryClient,
  chatId: string,
  message: any,
) => {
  queryClient.setQueryData(["chats", chatId, "messages"], (oldData: any) => {
    if (!oldData) {
      return {
        pages: [{ data: [message] }],
        pageParams: [0],
      };
    }

    const data = {
      ...oldData,
      pages: oldData.pages.map((page: any, index: number) => {
        if (index !== 0) return page;
        return {
          ...page,
          data: [message, ...page.data],
        };
      }),
    };

    console.log(data)

    return data;
  });
};

export const setQueryMessageStream = ({
  chunk,
  messageId,
  queryClient,
  chatId,
}: {
  chunk: string;
  messageId: string;
  queryClient: QueryClient;
  chatId: string;
}) => {
  queryClient.setQueryData(["chats", chatId, "messages"], (oldData: any) => {
    if (!oldData) return oldData;
    const newPages = [...oldData.pages];
    const firstPage = { ...newPages[0] };
    const messages = [...firstPage.data];
    const firstMessage = messages[0];

    if (firstMessage && firstMessage.role === "assistant") {
      messages[0] = {
        ...firstMessage,
        content: (firstMessage.content || "") + chunk,
      };
    } else {
      messages.unshift({
        id: messageId || `temp-${Date.now()}`,
        role: "assistant",
        content: chunk,
        createdAt: new Date().toISOString(),
      });
    }

    newPages[0] = { ...firstPage, data: messages };
    return { ...oldData, pages: newPages };
  });
};
