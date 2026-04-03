import { useState, useRef, useEffect } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { useParams } from "react-router";

import { useChat } from "@/hooks/useChat";
import { Input } from "@/components";
import { MessageWrapper, type MessageWrapperRef } from "@/layouts";

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();

  const wrapperRef = useRef<MessageWrapperRef>(null);
  const [input, setInput] = useState("");

  // const { messages, sendMessage, isLoading, clearChat } = useChat();

  // useEffect(() => {
  //   wrapperRef.current?.scrollToBottom();
  // }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");

    // await sendMessage(currentInput);
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
          {/* {messages.length === 0 && !isLoading && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-neutral flex items-center justify-center text-xs">
                  🤖
                </div>
              </div>
              <div className="chat-bubble bg-base-200 text-base-content">
                ¡Hola! Soy tu asistente de Agronegocios. ¿En qué puedo ayudarte
                hoy con tus cultivos?
              </div>
            </div>
          )} */}

          {/* {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat ${msg.sender === "user" ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-neutral flex items-center justify-center text-xs">
                  {msg.sender === "user" ? "👨‍🌾" : "🤖"}
                </div>
              </div>
              <div className="chat-header opacity-50 text-[10px] mb-1">
                {msg.sender === "user" ? "Tú" : "AgroBot"}
                <time className="ml-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <div
                className={`chat-bubble shadow-sm ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))} */}

          {/* {isLoading && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-neutral flex items-center justify-center text-xs">
                  🤖
                </div>
              </div>
              <div className="chat-bubble bg-base-200 opacity-70 italic">
                AgroBot está pensando...
              </div>
            </div>
          )} */}

          <span>{chatId ? "este es un chat" : "nuevo chat"}</span>
        </div>

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
              disabled={!input.trim()}
            >
              <SendHorizontal className="size-3.5" />
            </button>
          </div>
        </div>
      </MessageWrapper>
    </div>
  );
}
