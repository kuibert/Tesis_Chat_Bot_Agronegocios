import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as IChatMessage } from '../types';

interface Props {
    message: IChatMessage;
}

export default function ChatMessage({ message }: Props) {
    const isUser = message.sender === 'user';
    const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {/* Avatar Bot */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2 self-end mb-1 flex-shrink-0 shadow-sm">
                    <span className="text-white text-[10px] font-bold">IA</span>
                </div>
            )}

            {/* Burbuja de Mensaje */}
            <div
                className={`max-w-[85%] md:max-w-[75%] p-4 shadow-sm ${isUser
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none markdown-body'
                    }`}
            >
                {isUser ? (
                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed select-text">
                        {message.text}
                    </p>
                ) : (
                    <div className="text-sm md:text-base leading-relaxed select-text">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                        </ReactMarkdown>
                    </div>
                )}

                {/* Timestamp */}
                <span className={`block text-[10px] mt-2 text-right ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                    {timeFormatted}
                </span>
            </div>
        </div>
    );
}
