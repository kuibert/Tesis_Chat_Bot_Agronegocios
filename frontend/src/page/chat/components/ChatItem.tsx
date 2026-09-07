import { memo, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { MarkdownMessage } from "./MarkdownMessage";
import { NutrientResultCard } from "./NutrientResultCard";

export const ChatItem = memo(
  ({
    msg,
    isLast,
    isGenerating,
    hasStarted,
    onSendMessage,
  }: {
    msg: any;
    isLast: boolean;
    isGenerating: boolean;
    hasStarted: boolean;
    onSendMessage?: (
      content: string,
      paramChatId?: string,
      toolParams?: {
        cultivo: string;
        fuenteArchivo: string | null;
        areaHectareas: number;
        diaDespuesSiembra: number;
        diasDelPeriodo: number;
      }
    ) => void;
  }) => {
    const isAssistant = msg.role === "assistant";
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!msg.content) return;
        navigator.clipboard.writeText(msg.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
      <div
        key={msg.id}
        className={`flex w-full mb-10 ${!isAssistant ? "justify-end" : "justify-start"}`}
      >
        {isAssistant && (
            <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-[#0F1115] flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                <span className="text-white text-xs">🤖</span>
            </div>
        )}
        
        <div className={`flex flex-col ${isAssistant ? "max-w-[95%] md:max-w-[85%]" : "max-w-[85%] md:max-w-[75%]"} relative group`}>
            {isAssistant && (
                <div className="text-[10px] text-slate-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
                    <span className="font-medium text-slate-600 dark:text-gray-400">AgroBot</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
            
            <div
                className={`text-sm md:text-base leading-relaxed md:leading-7 shadow-sm ${
                    !isAssistant
                    ? "bg-emerald-600 text-white dark:bg-[#2D3139] dark:text-gray-200 px-5 py-3.5 rounded-2xl rounded-tr-none"
                    : "bg-white text-slate-800 dark:bg-[#1C1E22] dark:text-gray-200 px-5 py-3.5 rounded-2xl rounded-tl-none border border-slate-200 dark:border-[#2D3139]/50"
                }`}
            >
                {isLast && isAssistant && isGenerating && !hasStarted ? (
                    <span className="flex items-center gap-2 text-indigo-400 font-medium animate-pulse">
                        <Loader2 className="animate-spin size-4" />
                        Consultando la base de datos agrícola...
                    </span>
                ) : (
                    <>
                    {isAssistant ? (
                        <div className="pr-4">
                            <MarkdownMessage content={msg.content} />
                            {/* Card estructurada del resultado del tool — solo si hay metadata de cálculo */}
                            {msg.metadata?.resultados?.[0] && !isGenerating && (
                              <NutrientResultCard
                                resultado={msg.metadata.resultados[0] as any}
                                toolArgs={
                                  (() => {
                                    const raw = msg.metadata?.tool_calls?.[0]?.function?.arguments;
                                    if (typeof raw === "string") {
                                      try { return JSON.parse(raw); } catch { return {}; }
                                    }
                                    return raw as any;
                                  })()
                                }
                                onElegirOpcion={(opcion, args) => {
                                  const labelVisible = opcion.fuenteArchivo
                                    ? opcion.fuenteArchivo
                                        .replace(/_Req\._Diario\.csv$/i, "")
                                        .replace(/_MCA-EDA_Fert_\d{4}-\d+/i, "")
                                        .replace(/_/g, " ")
                                        .trim()
                                    : opcion.nombre;

                                  onSendMessage?.(
                                    `Usar programa: ${labelVisible}`,
                                    undefined,
                                    {
                                      cultivo: opcion.nombre,
                                      fuenteArchivo: opcion.fuenteArchivo,
                                      areaHectareas: args?.areaHectareas ?? 0.7,
                                      diaDespuesSiembra: args?.diaDespuesSiembra ?? 50,
                                      diasDelPeriodo: args?.diasDelPeriodo ?? 7,
                                    }
                                  );
                                }}
                              />
                            )}
                        </div>
                    ) : (
                        msg.content
                    )}

                    {isLast && isAssistant && isGenerating && hasStarted && (
                        <span className="animate-pulse ml-1 inline-block w-1.5 h-4 bg-indigo-500 relative top-0.5"></span>
                    )}
                    </>
                )}
            </div>
            
            {/* Botón de copiar */}
            {isAssistant && msg.content && (!isGenerating || hasStarted) && (
                <button
                    onClick={handleCopy}
                    className="absolute -right-10 top-6 p-1.5 text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-300 bg-white dark:bg-[#1C1E22] border border-slate-200 dark:border-[#2D3139] rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Copiar mensaje"
                >
                    {isCopied ? <Check className="size-4 text-emerald-600 dark:text-green-500" /> : <Copy className="size-4" />}
                </button>
            )}
        </div>
      </div>
    );
  },
);
