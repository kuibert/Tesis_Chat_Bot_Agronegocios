import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const WARNING_ICON = '⚠️';

export default function ChatInterface() {
    const { sessions, currentSessionId, isLoading, sendMessage } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Obtener la sesión activa
    const activeSession = sessions.find(s => s.id === currentSessionId);
    const messages = activeSession?.messages || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <main className="flex flex-col h-full bg-gray-50 font-sans relative flex-1 min-w-0">
            {/* Opcional: overlay para móviles si el sidebar está abierto */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm z-10 flex-shrink-0">
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-green-800 truncate">
                        {activeSession?.title || 'Asistente de Fertilización 🇭🇳'}
                    </h1>
                    <p className="text-xs text-gray-500 truncate">
                        Basado en datos históricos de Honduras
                    </p>
                </div>
            </header>

            {/* ÁREA DE MENSAJES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scroll-smooth">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 mt-10 max-w-md mx-auto animate-fade-in">
                        <span className="text-5xl mb-4 transform hover:scale-110 transition-transform">🌱</span>
                        <h2 className="text-gray-800 text-xl font-bold text-center mb-2">
                            Asistente de Campo
                        </h2>
                        <p className="text-gray-500 text-center mb-6 leading-relaxed text-sm">
                            Puedo ayudarte con recomendaciones basadas exclusivamente en planes de fertilización históricos de tu zona.
                        </p>

                        <div className="w-full bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 shadow-sm">
                            <p className="text-blue-800 font-bold mb-3 text-sm flex items-center">
                                <span className="mr-2">💡</span> Ejemplos de preguntas:
                            </p>
                            <button
                                onClick={() => sendMessage("¿Qué potasio usar para tomate en Cantarranas?")}
                                className="block w-full text-left text-blue-700 hover:text-blue-900 mb-2 py-1 text-sm border-b border-blue-100 last:border-0 hover:translate-x-1 transition-transform"
                            >
                                • "¿Qué potasio usar para tomate en Cantarranas?"
                            </button>
                            <button
                                onClick={() => sendMessage("Fórmula para café en Comayagua")}
                                className="block w-full text-left text-blue-700 hover:text-blue-900 py-1 text-sm hover:translate-x-1 transition-transform"
                            >
                                • "Fórmula para café en Comayagua"
                            </button>
                        </div>

                        <div className="flex items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm transition-all hover:bg-yellow-100">
                            <span className="text-xl mr-3 mt-0.5">{WARNING_ICON}</span>
                            <p className="text-xs text-yellow-800 leading-tight">
                                <strong>Recordatorio importante:</strong> Mis respuestas se basan en datos históricos. No sustituyen el criterio de un ingeniero agrónomo profesional en el sitio.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((item) => (
                        <ChatMessage key={item.id} message={item} />
                    ))
                )}

                {isLoading && (
                    <div className="flex items-center space-x-2 animate-pulse mt-4">
                        <div className="bg-gray-200 rounded-full px-4 py-2 flex items-center border border-gray-100 shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Consultando registros históricos...</span>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* BARRA DE ENTRADA EXTRAÍDA */}
            <ChatInput onSend={sendMessage} disabled={isLoading} />
        </main>
    );
}
