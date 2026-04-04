import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/libs/socket";

export const useChatSocket = (chatId: string | undefined) => {
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    socket.connect();

    socket.on("messages:created", (messagePlaceholder) => {
      console.log(messagePlaceholder);
      queryClient.setQueryData(
        ["chats", messagePlaceholder.chatId, "messages"],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any, index: number) => {
              if (index !== 0) return page;

              return {
                ...page,
                data: [messagePlaceholder, ...page.data],
              };
            }),
          };
        },
      );
    });

    // socket.on("messages:stream", (chunk: string) => {
    //   queryClient.setQueryData(
    //     ["chats", chatId, "messages"],
    //     (oldData: any) => {
    //       if (!oldData) return oldData;

    //       const newPages = [...oldData.pages];
    //       const lastPage = newPages[0]; // La página más reciente
    //       const messages = [...lastPage.data];
    //       const lastMsg = messages[0]; // Asumiendo que el índice 0 es el más nuevo

    //       if (lastMsg && lastMsg.sender === "assistant" && isTyping) {
    //         // Editamos el último mensaje del bot que se está construyendo
    //         messages[0] = { ...lastMsg, text: lastMsg.content + chunk };
    //       } else {
    //         // Creamos el mensaje del bot si es el primer chunk
    //         messages.unshift({
    //           id: `temp-${Date.now()}`,
    //           sender: "assistant",
    //           content: chunk,
    //           createdAt: new Date().toISOString(),
    //         });
    //       }

    //       newPages[0] = { ...lastPage, data: messages };
    //       return { ...oldData, pages: newPages };
    //     },
    //   );
    // });

    // socket.on("messages:end", () => setIsTyping(false));

    return () => {
      socket.off("messages:created");
      socket.off("messages:stream");
      socket.disconnect();
    };
  }, [chatId, queryClient, isTyping]);

  const sendMessage = (content: string, paramChatId?: string) => {
    socket.emit("messages:send", { chatId: paramChatId ?? chatId, content });
  };

  return { isTyping, sendMessage };
};
