import { useEffect } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { socket } from "@/libs/socket";

const GHOST_CHAT_ID = "no-memory-session";

const addLastMessage = (queryClient: QueryClient, message: any) => {
  queryClient.setQueryData(
    ["chats", message.chatId, "messages"],
    (oldData: any) => {
      if (!oldData && message.chatId === GHOST_CHAT_ID) {
        return {
          pages: [{ data: [message] }],
        };
      }

      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page: any, index: number) => {
          if (index !== 0) return page; 
          return {
            ...page,
            data: [message, ...page.data],
          };;
        }),
      };
    },
  );
};

export const useChatStatus = (chatId?: string) => {
  const queryClient = useQueryClient();

  return {
    isGenerating:
      queryClient.getQueryData(["chats", chatId, "isGenerating"]) ?? false,

    hasStarted:
      queryClient.getQueryData(["chats", chatId, "hasStarted"]) ?? false,
  };
};

export const useChatSocket = (chatId: string | undefined) => {
  const queryClient = useQueryClient();

  const activeChatId: string = chatId || GHOST_CHAT_ID;

  useEffect(() => {
    // if (!chatId) return;

    socket.connect();

    socket.on("messages:created", (messagePlaceholder) => {
      const targetId = messagePlaceholder.chatId || activeChatId;
      addLastMessage(queryClient, messagePlaceholder);
      if (messagePlaceholder.role === "assistant") {
        queryClient.setQueryData(["chats", targetId, "isGenerating"], true);
      }
    });

    socket.on("messages:stream", ({ chunk, messageId }) => {
      queryClient.setQueryData(["chats", activeChatId, "hasStarted"], true);

      queryClient.setQueryData(
        ["chats", activeChatId, "messages"],
        (oldData: any) => {
          if (!oldData) return oldData;

          const newPages = [...oldData.pages];
          const firstPage = newPages[0];
          const messages = [...firstPage.data];

          const firstMessage = messages[0];

          if (firstMessage && firstMessage.role === "assistant") {
            messages[0] = {
              ...firstMessage,
              content: (firstMessage.content || "") + chunk,
            };
          } else {
            messages.unshift({
              id: `temp-${Date.now()}`,
              role: "assistant",
              content: chunk,
              createdAt: new Date().toISOString(),
            });
          }

          newPages[0] = { ...firstPage, data: messages };

          return { ...oldData, pages: newPages };
        },
      );
    });

    socket.on("messages:end", () => {
      queryClient.setQueryData(["chats", activeChatId, "isGenerating"], false);

      queryClient.setQueryData(["chats", activeChatId, "hasStarted"], false);
    });

    return () => {
      socket.off("messages:created");
      socket.off("messages:stream");
      socket.off("messages:end");
      socket.disconnect();
    };
  }, [chatId, queryClient]);

  const sendMessage = (content: string, paramChatId?: string) => {
    socket.emit("messages:send", {
      chatId: paramChatId ?? activeChatId,
      content,
    });
  };

  return { sendMessage };
};
