import { useState, useRef, useEffect, useMemo, memo } from "react";
import { Paperclip, SendHorizontal, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { useCreateChat, useChatHistory } from "@/hooks/useChats";
import { useChatSocket, useChatStatus } from "@/hooks/useChatSocket";
import { Input, MarkdownMessage } from "@/components";
import { MessageWrapper, type MessageWrapperRef } from "@/layouts";
import { Chat } from "@/types/chat.types";

const ChatItem = memo(
  ({
    msg,
    isLast,
    isGenerating,
    hasStarted,
  }: {
    msg: any;
    isLast: any;
    isGenerating: any;
    hasStarted: any;
  }) => {
    const isAssistant = msg.role === "assistant";

    return (
      <div
        key={msg.id}
        className={`chat ${!isAssistant ? "chat-end" : "chat-start"}`}
      >
        <div className="chat-image avatar">
          <div className="w-10 rounded-full bg-neutral flex items-center justify-center text-xs">
            {!isAssistant ? "👨‍🌾" : "🤖"}
          </div>
        </div>
        <div className="chat-header opacity-50 text-[10px] mb-1">
          {!isAssistant ? "Tú" : "AgroBot"}
          <time className="ml-1">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <div
          className={`chat-bubble shadow-sm ${
            !isAssistant
              ? "bg-primary text-primary-content"
              : "bg-base-200 text-base-content"
          }`}
        >
          {isLast && isAssistant && isGenerating && !hasStarted ? (
            <span className="flex items-center gap-2">
              <span className="loading loading-dots loading-sm"></span>
              Pensando...
            </span>
          ) : (
            <>
              {isAssistant ? (
                <MarkdownMessage content={msg.content} />
              ) : (
                msg.content
              )} 

              {isLast && isAssistant && isGenerating && hasStarted && (
                <span className="animate-pulse ml-1">|</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const createChatMutation = useCreateChat();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useChatHistory(chatId ?? "");

  const { sendMessage } = useChatSocket(chatId);
  const { hasStarted, isGenerating } = useChatStatus(chatId);
  const previousHeightRef = useRef(0);
  const isFetchingMoreRef = useRef(false);

  const wrapperRef = useRef<MessageWrapperRef>(null);
  const [input, setInput] = useState("");

  const messages = useMemo(() => {
    const msg = data?.pages.flatMap((page) => page.data) ?? [];
    return msg.reverse();
  }, [data?.pages]);

  useEffect(() => {
    const container = wrapperRef.current?.getContainer();
    if (!container) return;

    if (isFetchingMoreRef.current) {
      const newHeight = container.scrollHeight;
      const diff = newHeight - previousHeightRef.current;

      container.scrollTop += diff;

      isFetchingMoreRef.current = false;
      return;
    }

    wrapperRef.current?.scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");

    if (!chatId) {
      createChatMutation.mutate(
        { data: { title: currentInput } },
        {
          onSuccess: (newChat: Chat) => {
            navigate(`/chat/${newChat.id}`);
            setTimeout(() => sendMessage(currentInput, newChat.id), 100);
          },
        },
      );
    } else {
      sendMessage(currentInput);
    }
  };

  const handleLoadMore = () => {
    const container = wrapperRef.current?.getContainer();

    if (container) {
      previousHeightRef.current = container.scrollHeight;
    }

    isFetchingMoreRef.current = true;
    fetchNextPage();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)] relative">
      <div className="absolute top-4 right-4 z-10">
        <button className="btn btn-ghost btn-xs opacity-50 hover:opacity-100">
          Limpiar historial
        </button>
      </div>

      <MessageWrapper ref={wrapperRef}>
        <div className="max-w-4xl w-full mx-auto p-4 space-y-4 mt-auto">
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <button
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => handleLoadMore()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="animate-spin size-4" />
                ) : (
                  "Cargar mensajes anteriores"
                )}
              </button>
            </div>
          )}
          {messages.length === 0 && !isLoading && !chatId && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-neutral flex items-center justify-center text-xs">
                  🤖
                </div>
              </div>
              <div className="chat-bubble bg-base-200 text-base-content">
                ¡Hola! Soy tu asistente de Agronegocios. ¿En qué puedo ayudarte?
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isLast = index === messages.length - 1;
            return (
              <ChatItem
                key={msg.id}
                msg={msg}
                isLast={isLast}
                isGenerating={isGenerating}
                hasStarted={hasStarted}
              />
            );
          })}

          {isLoading && chatId && (
            <div className="flex justify-center p-10">
              <span className="loading loading-dots loading-md"></span>
            </div>
          )}
        </div>

        {/* Input Sticky */}
        <div className="sticky bottom-0 w-full bg-transparent pt-2 pb-6 px-4">
          <div className="flex gap-2 items-end max-w-4xl mx-auto bg-base-200 backdrop-blur-md border border-base-300 px-4 py-2 rounded-[28px] shadow-lg">
            <button className="btn btn-circle btn-ghost btn-sm mb-1">
              <Paperclip className="size-3.5" />
            </button>

            <Input
              value={input}
              onChange={setInput}
              onSend={handleSendMessage}
              placeholder="Escribe tu consulta agrícola..."
            />

            <button
              className="btn btn-primary btn-circle shadow-md mb-1"
              onClick={handleSendMessage}
              disabled={!input.trim() || createChatMutation.isPending}
            >
              <SendHorizontal className="size-3.5" />
            </button>
          </div>
        </div>
      </MessageWrapper>
    </div>
  );
}
