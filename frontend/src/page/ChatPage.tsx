import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { useNavigate, useParams } from "react-router";
 
import { MessageWrapper, type MessageWrapperRef } from "@/layouts";
import { Chat } from "@/types/chat.types";
import { useAuth } from "@/hooks/useAuth";
import { useHistoryChat, useCreateChat, useListeChat, useClearHistoryChat } from "@/hooks/chat";

import { ChatItem } from "./chat/components/ChatItem";
import { ChatWelcome } from "./chat/components/ChatWelcome";
import { ChatInputBar } from "./chat/components/ChatInputBar";

export function ChatPage() {
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { hasSession } = useAuth();

  const chatId = useMemo(() => {
    if (urlChatId) return urlChatId;
    if (!hasSession) return "no-memory-session";
    return undefined; // Caso: nueva conversacion con sesion
  }, [urlChatId, hasSession]);

  const createChatMutation = useCreateChat();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useHistoryChat(chatId ?? "");

  const { hasStarted, isGenerating, sendMessage, stopGeneration } = useListeChat(chatId);
  const clearHistoryMutation = useClearHistoryChat();
 
  const previousHeightRef = useRef(0);
  const isFetchingMoreRef = useRef(false);

  const wrapperRef = useRef<MessageWrapperRef>(null);
  const [input, setInput] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false);

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

    // Auto-scroll on new message if we are already near bottom or it's the first load
    if (!showScrollDown) {
        wrapperRef.current?.scrollToBottom();
    }
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      // Show button if we are scrolled up more than 100px from the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollDown(!isNearBottom);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");
    wrapperRef.current?.scrollToBottom(); // Scroll to bottom when sending

    if (!chatId && hasSession) {
      createChatMutation?.mutate(
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

  const handleClearHistory = () => {
      if (chatId && clearHistoryMutation && confirm("¿Estás seguro de que quieres limpiar el historial de este chat?")) {
          clearHistoryMutation.mutate(chatId);
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
    <div className="flex-1 flex flex-col h-full relative">
      {chatId && messages.length > 0 && (
          <div className="absolute top-4 right-8 z-20">
              <button
                  onClick={handleClearHistory}
                  disabled={clearHistoryMutation?.isPending}
                  className="text-xs text-gray-500 hover:text-red-400 bg-[#1C1E22] border border-[#2D3139] px-3 py-1.5 rounded-full transition-colors shadow-sm"
              >
                  {clearHistoryMutation?.isPending ? "Limpiando..." : "Limpiar historial"}
              </button>
          </div>
      )}
      <MessageWrapper ref={wrapperRef} onScroll={handleScroll}>
        <div className="max-w-3xl w-full mx-auto px-4 md:px-6 flex flex-col pt-12 pb-28 space-y-6">
          
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

          {messages.length === 0 && !isLoading && !chatId && <ChatWelcome />}

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
      </MessageWrapper>

      {showScrollDown && (
          <button
              onClick={() => wrapperRef.current?.scrollToBottom()}
              className="absolute bottom-24 right-8 z-30 p-2 bg-[#2D3139] border border-[#3A3F4A] rounded-full text-gray-300 hover:text-white shadow-lg transition-colors"
              title="Ir al final"
          >
              <ArrowDown className="size-5" />
          </button>
      )}

      <ChatInputBar 
          input={input} 
          setInput={setInput} 
          onSend={handleSendMessage} 
          onStop={stopGeneration}
          isGenerating={isGenerating}
          isPending={createChatMutation?.isPending || false} 
      />
    </div>
  );
}
