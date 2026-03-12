import React from 'react';
import { useChat } from '../hooks/useChat';

export default function Sidebar() {
    const { sessions, currentSessionId, createNewChat, switchSession, deleteSession } = useChat();

    return (
        <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full flex-shrink-0 relative z-20 transition-all duration-300">
            {/* Header Sidebar */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                <h2 className="text-gray-200 font-bold text-lg tracking-wide hidden md:block">Historial</h2>
                <button
                    onClick={createNewChat}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-green-700 hover:bg-green-600 text-white p-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm border border-green-800"
                    title="Nueva Conversación"
                >
                    <span className="text-lg leading-none">+</span>
                    <span>Nuevo Chat</span>
                </button>
            </div>

            {/* Listado de Sesiones */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 ? (
                    <div className="text-center p-4 text-gray-500 text-sm mt-4">
                        No hay historial aún.
                    </div>
                ) : (
                    sessions.map((session) => {
                        const isActive = session.id === currentSessionId;
                        return (
                            <div
                                key={session.id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 border ${isActive
                                        ? 'bg-gray-800 border-gray-700 text-white'
                                        : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                    }`}
                                onClick={() => switchSession(session.id)}
                            >
                                <div className="flex items-center flex-1 overflow-hidden pr-2">
                                    <span className={`mr-3 text-lg ${isActive ? 'text-green-500' : 'text-gray-600'}`}>
                                        💬
                                    </span>
                                    <span className="truncate text-sm font-medium">
                                        {session.title || 'Conversación'}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSession(session.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all duration-200"
                                    title="Eliminar chat"
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Sidebar (Mini Profile/Credits) */}
            <div className="p-4 border-t border-gray-800 bg-gray-950 text-xs text-gray-500 text-center">
                AgroChat Honduras © 2026
            </div>
        </aside>
    );
}
