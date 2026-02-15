// -----------------------------------------------------------------------------
// DEFINICIÓN DE TIPOS - CHATBOT AGRÍCOLA
// -----------------------------------------------------------------------------

/**
 * Representa un mensaje individual en la conversación.
 */
export interface ChatMessage {
    id: string;               // UUID único del mensaje
    text: string;             // Contenido del mensaje
    sender: 'user' | 'bot';   // Emisor del mensaje
    timestamp: number;        // Fecha/hora de envío (ms)
}

/**
 * Estado global del Chat manejado por Zustand.
 */
export interface ChatState {
    // Estado
    messages: ChatMessage[];
    isLoading: boolean;
    sessionId: string;

    // Acciones
    sendMessage: (text: string) => Promise<void>;
    clearChat: () => void;
    setSessionId: (id: string) => void;
}

/**
 * Estructura de respuesta del Backend (API de Fertilización).
 * Basado en pgvector + BERT
 */
export interface FertilizationPlanResponse {
    cultivo: string;
    zona: string;
    dias_cosecha: number;
    formula_npk: string;
    fuente_potasio: string;
    observaciones_tecnicas: string;
    similitud: number; // Score de coseno (0-1)
}

/**
 * Respuesta API Estándar.
 */
export interface ApiResponse {
    answer: string;                  // Respuesta generada con template
    sources: FertilizationPlanResponse[]; // Fuentes históricas encontradas
    metadata: {
        processed_time_ms: number;
    }
}
