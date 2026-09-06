import { useCallback, useEffect } from "react";
import { socket } from "@/libs/socket";

import { useAuth } from "../useAuth";
import {
  setQueryDataChat,
  setQueryMessageStream,
  setQueryMessageMetadata,
  useGetChats,
  useCreateChat as useQueryCreateChat,
  useQueryHistoryChat,
  useQueryStatusChat,
  useDeleteChat as useQueryDeleteChat,
  useClearHistoryChat as useQueryClearHistoryChat,
  useRenameChat as useQueryRenameChat,
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

export const useDeleteChat = () => {
  const { hasSession } = useAuth();
  const mutation = useQueryDeleteChat();
  return hasSession ? mutation : null;
};

export const useClearHistoryChat = () => {
  const { hasSession } = useAuth();
  const mutation = useQueryClearHistoryChat();
  return hasSession ? mutation : null;
};

export const useRenameChat = () => {
  const { hasSession } = useAuth();
  const mutation = useQueryRenameChat();
  return hasSession ? mutation : null;
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

  const onEnd = useCallback(
    ({ messageId, metadata }: { messageId?: string; metadata?: Record<string, unknown> | null } = {}) => {
      console.log("📥 [Socket messages:end]", { messageId, metadata });
      resetStatus();
      if (messageId && metadata) {
        setQueryMessageMetadata({
          messageId,
          metadata,
          queryClient,
          chatId: activeChatId,
        });
      }
    },
    [resetStatus, queryClient, activeChatId],
  );

  const onError = useCallback(
    (errorMsg: string) => {
      resetStatus();
      setQueryDataChat(queryClient, activeChatId, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${errorMsg || "Ocurrió un error. Por favor, intenta de nuevo."}`,
        createdAt: new Date().toISOString(),
      });
    },
    [resetStatus, queryClient, activeChatId],
  );

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("messages:created", onCreated);
    socket.on("messages:stream", onStream);
    socket.on("messages:end", onEnd);
    socket.on("messages:error", onError);

    return () => {
      socket.off("messages:created", onCreated);
      socket.off("messages:stream", onStream);
      socket.off("messages:end", onEnd);
      socket.off("messages:error", onError);
    };
  }, [onCreated, onStream, onEnd, onError]);

  const sendMessage = useCallback(
    (
      content: string,
      paramChatId?: string,
      toolParams?: {
        cultivo: string;
        fuenteArchivo: string | null;
        areaHectareas: number;
        diaDespuesSiembra: number;
        diasDelPeriodo: number;
      }
    ) => {
      const finalChatId = paramChatId || chatId || GHOST_CHAT_ID;
      if (toolParams) {
        // Caso de desambiguación resuelta: enviar parámetros directos al backend
        socket.emit("messages:calculate", {
          chatId: finalChatId,
          content, // texto legible para mostrar como mensaje del usuario
          toolParams, // parámetros ya resueltos para el motor
        });
      } else {
        socket.emit("messages:send", {
          chatId: finalChatId,
          content,
        });
      }
    },
    [chatId],
  );

  const stopGeneration = useCallback(() => {
      socket.emit("messages:stop", activeChatId);
  }, [activeChatId]);

  return { sendMessage, stopGeneration, isGenerating, hasStarted };
};
