import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SEND_ICON = '➤';
const WARNING_ICON = '⚠️';

export default function ChatInterface() {
    const { messages, isLoading, sendMessage, clearChat } = useChat();
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold text-green-800">
                        Asistente de Fertilización 🇭🇳
                    </h1>
                    <p className="text-xs text-gray-500">
                        Basado en datos históricos de Honduras
                    </p>
                </div>
                <button
                    onClick={clearChat}
                    className="p-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors"
                >
                    Nuevo Chat
                </button>
            </header>

            {/* ÁREA DE MENSAJES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 mt-10 max-w-md mx-auto">
                        <span className="text-5xl mb-4">🌱</span>
                        <h2 className="text-gray-800 text-xl font-bold text-center mb-2">
                            Bienvenido a tu Asistente de Campo
                        </h2>
                        <p className="text-gray-500 text-center mb-6 leading-relaxed">
                            Puedo ayudarte con recomendaciones basadas exclusivamente en planes de fertilización históricos de tu zona.
                        </p>

                        <div className="w-full bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                            <p className="text-blue-800 font-bold mb-3 text-sm flex items-center">
                                <span className="mr-2">💡</span> Ejemplos de preguntas:
                            </p>
                            <button
                                onClick={() => setInputText("¿Qué potasio usar para tomate en Cantarranas?")}
                                className="block w-full text-left text-blue-600 hover:text-blue-800 mb-2 py-1 text-sm border-b border-blue-100 last:border-0"
                            >
                                • "¿Qué potasio usar para tomate en Cantarranas?"
                            </button>
                            <button
                                onClick={() => setInputText("Fórmula para café en Comayagua")}
                                className="block w-full text-left text-blue-600 hover:text-blue-800 py-1 text-sm"
                            >
                                • "Fórmula para café en Comayagua"
                            </button>
                        </div>

                        <div className="flex items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <span className="text-xl mr-3 mt-0.5">{WARNING_ICON}</span>
                            <p className="text-xs text-yellow-800 leading-tight">
                                <strong>Recordatorio importante:</strong> Mis respuestas se basan en datos históricos. No sustituyen el criterio de un ingeniero agrónomo profesional en el sitio.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((item) => {
                        const isUser = item.sender === 'user';
                        return (
                            <div key={item.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                {!isUser && (
                                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2 self-end mb-1 flex-shrink-0">
                                        <span className="text-white text-[10px] font-bold">IA</span>
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] md:max-w-[75%] p-4 shadow-sm ${isUser
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none markdown-body'
                                        }`}
                                >
                                    {isUser ? (
                                        <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                                            {item.text}
                                        </p>
                                    ) : (
                                        <div className="text-sm md:text-base leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {item.text}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    <span className={`block text-[10px] mt-2 text-right ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}

                {isLoading && (
                    <div className="flex items-center space-x-2 animate-pulse">
                        <div className="bg-gray-200 rounded-full px-4 py-2 flex items-center border border-gray-100">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500">Consultando registros...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* BARRA DE ENTRADA */}
            <form
                onSubmit={handleSend}
                className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 md:pb-4 flex items-end space-x-2"
            >
                <textarea
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm md:text-base text-gray-800 border-none focus:ring-2 focus:ring-green-500 resize-none max-h-32"
                    placeholder="Escribe tu consulta agrícola..."
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity ${!inputText.trim() || isLoading ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    <span className="text-white transform rotate-45">{SEND_ICON}</span>
                </button>
            </form>
        </div>
    );
}
