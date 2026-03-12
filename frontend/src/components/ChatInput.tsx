import React, { useState } from 'react';

interface Props {
    onSend: (text: string) => void;
    disabled: boolean;
}

const SEND_ICON = '➤';

export default function ChatInput({ onSend, disabled }: Props) {
    const [inputText, setInputText] = useState('');

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputText.trim() && !disabled) {
            onSend(inputText);
            setInputText('');
        }
    };

    return (
        <form
            onSubmit={handleSend}
            className="flex-shrink-0 bg-white border-t border-gray-200 p-4 pb-8 md:pb-4 flex items-end space-x-2 relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        >
            <textarea
                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm md:text-base text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32 transition-shadow"
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
                disabled={disabled}
            />
            <button
                type="submit"
                disabled={!inputText.trim() || disabled}
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${!inputText.trim() || disabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md hover:scale-105 active:scale-95'
                    }`}
            >
                <span className="transform rotate-45">{SEND_ICON}</span>
            </button>
        </form>
    );
}
