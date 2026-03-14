import { Paperclip, SendHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components";
import { MessageWrapper, type MessageWrapperRef } from "@/layouts";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

export function ChatPage() {
  const wrapperRef = useRef<MessageWrapperRef>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! Soy tu asistente de Agronegocios. ¿En qué puedo ayudarte hoy con tus cultivos?",
      sender: "ai",
      timestamp: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    wrapperRef.current?.scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        text: "Analizando datos de mercado... Actualmente el precio del maíz ha subido un 2% en la región central.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)] relative">
      <MessageWrapper ref={wrapperRef}>
        <div className="max-w-4xl w-full mx-auto p-4 space-y-4 mt-auto">
          {messages.map((msg) => (
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
                <time className="ml-1">{msg.timestamp}</time>
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
          ))}
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
