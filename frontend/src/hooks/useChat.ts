import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axios from 'axios';
import { ChatMessage, ChatState, ApiResponse } from '../types';

// Generador de UUID simple
const generateId = () => Math.random().toString(36).substring(2, 11);

// API Client básico (axios) - Adaptado para Vite
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
});

/**
 * useChat: Store global para manejar el estado del chat.
 * Usamos localStorage para simplificar el despliegue en web con Vite.
 */
export const useChat = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [] as ChatMessage[],
            isLoading: false,
            sessionId: generateId(),

            setSessionId: (id: string) => set({ sessionId: id }),

            sendMessage: async (text: string) => {
                const { sessionId } = get();

                if (!text.trim()) return;

                const userMessage: ChatMessage = {
                    id: generateId(),
                    text,
                    sender: 'user',
                    timestamp: Date.now(),
                };

                set((state: ChatState) => ({
                    messages: [...state.messages, userMessage],
                    isLoading: true,
                }));

                try {
                    const response = await api.post<ApiResponse>('/chat', { sessionId, question: text });

                    const botMessage: ChatMessage = {
                        id: generateId(),
                        text: response.data.answer,
                        sender: 'bot',
                        timestamp: Date.now(),
                    };

                    set((state: ChatState) => ({
                        messages: [...state.messages, botMessage],
                        isLoading: false,
                    }));

                } catch (error) {
                    console.error('Error enviando mensaje:', error);

                    const errorMessage: ChatMessage = {
                        id: generateId(),
                        text: "Lo siento, tuve un problema conectando con la base de datos de fertilización. Por favor verifica tu conexión e intenta de nuevo.",
                        sender: 'bot',
                        timestamp: Date.now(),
                    };

                    set((state: ChatState) => ({
                        messages: [...state.messages, errorMessage],
                        isLoading: false,
                    }));
                }
            },

            clearChat: () => {
                set({
                    messages: [],
                    sessionId: generateId(),
                    isLoading: false
                });
            },
        }),
        {
            name: 'fertilization-chat-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: ChatState) => ({
                messages: state.messages,
                sessionId: state.sessionId
            }),
        }
    )
);
