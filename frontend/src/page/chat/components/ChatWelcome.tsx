import React from "react";

export function ChatWelcome() {
    return (
        <div className="flex w-full justify-center mt-10">
            <div className="flex max-w-[75%] items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-[#0F1115] flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                    <span className="text-white text-xs">🤖</span>
                </div>
                <div className="flex flex-col">
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
                        <span className="font-medium text-slate-600 dark:text-gray-400">AgroBot</span>
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1C1E22] text-slate-800 dark:text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-none border border-slate-200 dark:border-[#2D3139]/50 shadow-sm text-sm">
                        ¡Hola! Soy tu asistente de Agronegocios. ¿En qué puedo ayudarte hoy con tus cultivos?
                    </div>
                </div>
            </div>
        </div>
    );
}
