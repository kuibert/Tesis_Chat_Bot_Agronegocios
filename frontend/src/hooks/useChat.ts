import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axios from 'axios';
import { ChatState, ChatSession, ChatMessage, ApiResponse } from '../types';

// Generador de UUID
const generateId = () => Math.random().toString(36).substring(2, 11);

// API Client
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
});

/**
 * Helper para crear una nueva sesión vacía
 */
const createEmptySession = (): ChatSession => ({
    id: generateId(),
    title: 'Nueva conversación',
    updatedAt: Date.now(),
    messages: []
});

/**
 * Global Store Zustand para Historial de Chats Agrícolas
 */
export const useChat = create<ChatState>()(
    persist(
        (set, get) => ({
            sessions: [createEmptySession()],
            currentSessionId: null, // Se asignará en la app si es null
            isLoading: false,

            createNewChat: () => {
                const newSession = createEmptySession();
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: newSession.id,
                }));

                // Limpiar backend session de forma silente
                api.post('/session/reset', { sessionId: newSession.id }).catch(() => { });
            },

            switchSession: (id: string) => {
                set({ currentSessionId: id });
            },

            deleteSession: (id: string) => {
                set((state) => {
                    const newSessions = state.sessions.filter(s => s.id !== id);
                    // Si borramos todas, crear una nueva obligatoriamente
                    if (newSessions.length === 0) {
                        const freshSession = createEmptySession();
                        return {
                            sessions: [freshSession],
                            currentSessionId: freshSession.id
                        };
                    }
                    // Si borramos la actual, saltar a la primera disponible
                    let currentId = state.currentSessionId;
                    if (currentId === id) {
                        currentId = newSessions[0].id;
                    }
                    return {
                        sessions: newSessions,
                        currentSessionId: currentId
                    };
                });
            },

            sendMessage: async (text: string) => {
                const { sessions, currentSessionId } = get();
                if (!text.trim() || !currentSessionId) return;

                const userMessage: ChatMessage = {
                    id: generateId(),
                    text,
                    sender: 'user',
                    timestamp: Date.now(),
                };

                // Actualizar la sesión activa con el mensaje del usuario
                set((state) => {
                    const updatedSessions = state.sessions.map((session) => {
                        if (session.id === currentSessionId) {
                            // Si es el primer mensaje, nombrar la sesión en base al texto del usuario
                            const newTitle = session.messages.length === 0
                                ? text.substring(0, 30) + (text.length > 30 ? '...' : '')
                                : session.title;

                            return {
                                ...session,
                                title: newTitle,
                                updatedAt: Date.now(),
                                messages: [...session.messages, userMessage]
                            };
                        }
                        return session;
                    });
                    // Ordenar por las más recientes primero
                    updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
                    return { sessions: updatedSessions, isLoading: true };
                });

                try {
                    const response = await api.post<ApiResponse>('/chat', {
                        sessionId: currentSessionId,
                        question: text
                    });

                    const botMessage: ChatMessage = {
                        id: generateId(),
                        text: response.data.answer,
                        sender: 'bot',
                        timestamp: Date.now(),
                    };

                    set((state) => {
                        const finalSessions = state.sessions.map((session) => {
                            if (session.id === currentSessionId) {
                                return {
                                    ...session,
                                    updatedAt: Date.now(),
                                    messages: [...session.messages, botMessage]
                                };
                            }
                            return session;
                        });
                        return { sessions: finalSessions, isLoading: false };
                    });

                } catch (error) {
                    console.error('Error enviando mensaje:', error);

                    const errorMessage: ChatMessage = {
                        id: generateId(),
                        text: "❌ Hubo un problema conectando con el asistente. Intenta de nuevo.",
                        sender: 'bot',
                        timestamp: Date.now(),
                    };

                    set((state) => {
                        const errorSessions = state.sessions.map((session) => {
                            if (session.id === currentSessionId) {
                                return { ...session, messages: [...session.messages, errorMessage] };
                            }
                            return session;
                        });
                        return { sessions: errorSessions, isLoading: false };
                    });
                }
            },
        }),
        {
            name: 'agrochat-history-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: ChatState) => ({
                sessions: state.sessions,
                currentSessionId: state.currentSessionId
            }),
        }
    )
);
