import React from "react";
import { SendHorizontal, Square } from "lucide-react";
import { Input } from "@/components";

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isPending: boolean;
  isGenerating?: boolean;
}

export function ChatInputBar({ input, setInput, onSend, onStop, isPending, isGenerating }: Props) {
  return (
    <div className="absolute browser-only-bottom left-0 right-0 w-full px-4 z-20 pointer-events-none">
      <div className="flex gap-3 items-center max-w-3xl mx-auto bg-white dark:bg-[#1C1E22] border border-slate-200 dark:border-[#2D3139]/50 px-4 py-2 rounded-full shadow-lg pointer-events-auto transition-colors duration-200">
        <Input
          value={input}
          onChange={setInput}
          onSend={isGenerating ? undefined : onSend}
          placeholder="Escribe tu consulta agrícola..."
          className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 resize-none max-h-32"
          readOnly={isGenerating}
        />

        {isGenerating ? (
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-red-500/20 text-red-500 hover:bg-red-500/30"
            onClick={onStop}
            title="Detener generación"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              !input.trim() || isPending
                ? "bg-slate-100 dark:bg-[#2D3139] text-slate-400 dark:text-gray-500"
                : "bg-emerald-600 hover:bg-emerald-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
            }`}
            onClick={onSend}
            disabled={!input.trim() || isPending}
          >
            <SendHorizontal className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
