import React from "react";

export function ChatWelcome() {
    return (
        <div className="flex w-full justify-center mt-10">
            <div className="flex max-w-[75%] items-start">
                <div className="w-8 h-8 rounded-full bg-[#0F1115] flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <span className="text-white text-xs">🤖</span>
                </div>
                <div className="flex flex-col">
                    <div className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-2">
                        <span>AgroBot</span>
                        <span>10:00 AM</span>
                    </div>
                    <div className="bg-[#1C1E22] text-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-none border border-[#2D3139]/50 text-sm">
                        ¡Hola! Soy tu asistente de Agronegocios. ¿En qué puedo ayudarte hoy con tus cultivos?
                    </div>
                </div>
            </div>
        </div>
    );
}
