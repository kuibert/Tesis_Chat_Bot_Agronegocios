import { useCallback, useEffect } from "react";
import { socket } from "@/libs/socket";

import { useAuth } from "../useAuth";
import {
  setQueryDataChat,
  setQueryMessageStream,
  useGetChats,
  useCreateChat as useQueryCreateChat,
  useQueryHistoryChat,
  useQueryStatusChat,
} from "./useQueryChat";
import { useQueryClient } from "@tanstack/react-query";

const GHOST_CHAT_ID = "no-memory-session";

export const useChats = () => {
  const { hasSession } = useAuth();
  return useGetChats({ enabled: hasSession });
};

export const useCreateChat = () => {
  const { hasSession } = useAuth();

  const mutation = useQueryCreateChat();

  return hasSession ? mutation : null;
};

export const useHistoryChat = (chatId: string) => {
  const { hasSession } = useAuth();
 
  return useQueryHistoryChat(chatId, { hasMemory: hasSession });
};

export const useListeChat = (chatId: string | undefined) => {
  const queryClient = useQueryClient();
  const {
    setIsGenerating,
    setHasStarted,
    resetStatus,
    isGenerating,
    hasStarted,
  } = useQueryStatusChat(chatId);

  const activeChatId = chatId || GHOST_CHAT_ID;

  const onCreated = useCallback(
    (msg: any) => {
      setQueryDataChat(queryClient, activeChatId, msg);
      if (msg.role === "assistant") setIsGenerating(true);
    },
    [activeChatId, queryClient, setIsGenerating],
  );

  const onStream = useCallback(
    ({ chunk, messageId }: { chunk: string; messageId: string }) => {
      setHasStarted(true);
      setQueryMessageStream({
        chunk,
        messageId,
        queryClient,
        chatId: activeChatId,
      });
    },
    [activeChatId, queryClient, setHasStarted],
  );

  const onEnd = useCallback(() => {
    resetStatus();
  }, [resetStatus]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("messages:created", onCreated);

    socket.on("messages:stream", onStream);
    socket.on("messages:end", onEnd);

    return () => {
      socket.off("messages:created", onCreated);
      socket.off("messages:stream", onStream);
      socket.off("messages:end", onEnd);
    };
  }, [onCreated, onStream, onEnd]);

  const sendMessage = useCallback(
    (content: string, paramChatId?: string) => {
      const finalChatId = paramChatId || chatId || GHOST_CHAT_ID;

      socket.emit("messages:send", {
        chatId: finalChatId,
        content,
      });
    },
    [chatId],
  );

  return { sendMessage, isGenerating, hasStarted };
};
