import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useChats, useDeleteChat, useRenameChat } from '@/hooks/chat';
import { History, MessageSquare, Pencil, Check, X } from 'lucide-react';

export function SideBar({ className }: { className?: string }) {
    const navigate = useNavigate();
    const { chatId: currentSessionId } = useParams<{ chatId: string }>();
    const { data: sessions = [] } = useChats();
    const deleteChatMutation = useDeleteChat();
    const renameChatMutation = useRenameChat();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const createNewChat = () => {
        navigate('/');
    };

    const switchSession = (id: string) => {
        if (editingId) return; // Prevent switching while editing
        navigate(`/chat/${id}`);
    };

    const deleteSession = (id: string) => {
        if (deleteChatMutation) {
            deleteChatMutation.mutate(id, {
                onSuccess: () => {
                    if (currentSessionId === id) {
                        navigate('/');
                    }
                }
            });
        }
    };

    const startEditing = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle || 'Conversación');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle("");
    };

    const saveEditing = (id: string) => {
        if (!editTitle.trim()) {
            cancelEditing();
            return;
        }

        if (renameChatMutation) {
            renameChatMutation.mutate({ chatId: id, title: editTitle.trim() }, {
                onSuccess: () => {
                    setEditingId(null);
                }
            });
        } else {
            setEditingId(null);
        }
    };

    return (
        <div className={className}>
            <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
            <aside className="w-72 bg-[#1A1D21] flex flex-col min-h-full flex-shrink-0 relative z-20 transition-all duration-300">
                {/* Header Sidebar */}
                <div className="p-5 flex items-center gap-3">
                    <MessageSquare className="text-white size-5" />
                    <h2 className="text-white font-bold text-lg tracking-wide">AGRO CHAT</h2>
                </div>

                <div className="px-5 mb-8 mt-2">
                    <button
                        onClick={createNewChat}
                        className="w-full flex items-center justify-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        title="Nueva Conversación"
                    >
                        <span className="text-lg leading-none">+</span>
                        <span>Nuevo chat</span>
                    </button>
                </div>

                <div className="px-5 mb-4 flex items-center gap-2 text-gray-500">
                    <History className="size-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Mis chats</span>
                </div>

                {/* Listado de Sesiones */}
                <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
                    {sessions.length === 0 ? (
                        <div className="text-center p-4 text-gray-500 text-sm mt-4">
                            No hay historial aún.
                        </div>
                    ) : (
                        sessions.map((session) => {
                            const isActive = session.id === currentSessionId;
                            const isEditing = session.id === editingId;

                            return (
                                <div
                                    key={session.id}
                                    className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors duration-200 ${isActive
                                            ? 'bg-gray-800/60 text-white'
                                            : 'bg-transparent text-gray-300 hover:bg-gray-800/40 hover:text-white'
                                        }`}
                                    onClick={() => !isEditing && session.id && switchSession(session.id)}
                                >
                                    <div className="flex items-center flex-1 overflow-hidden px-1 mr-2">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEditing(session.id!);
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                                autoFocus
                                                className="w-full bg-[#2D3139] text-white text-sm px-2 py-1 rounded outline-none border border-indigo-500/50"
                                            />
                                        ) : (
                                            <span className="truncate text-sm font-medium">
                                                {session.title || 'Conversación'}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`flex items-center gap-1 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-200`}>
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); saveEditing(session.id!); }}
                                                    className="p-1 text-green-500 hover:text-green-400"
                                                    title="Guardar"
                                                >
                                                    <Check className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                                    className="p-1 text-red-500 hover:text-red-400"
                                                    title="Cancelar"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditing(session.id!, session.title!);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-indigo-400"
                                                    title="Renombrar chat"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (session.id) deleteSession(session.id);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-red-400"
                                                    title="Eliminar chat"
                                                >
                                                    <span className="text-[13px]">🗑️</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>
        </div>
    );
}
