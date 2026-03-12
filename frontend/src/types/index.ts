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
 * Basado en pgvector + DistilBERT multilingüe (Xenova/distiluse-base-multilingual-cased-v2)
 */
export interface FertilizationPlanResponse {
    cultivo: string;
    zona: string;
    dias_cosecha: number;
    formula_npk: string;
    fuente_potasio: string;
    observaciones_tecnicas: string;
    similitud: number; // Score de similitud coseno (0-1) generado por pgvector
}

/**
 * Respuesta API Estándar — alineada con lo que devuelve el backend en /api/chat.
 */
export interface ApiResponse {
    answer: string;                       // Respuesta generada con template RAG
    sources: FertilizationPlanResponse[]; // Fuentes históricas encontradas por DistilBERT
    metadata: {
        processed_time_ms: number;        // Tiempo de procesamiento en milisegundos
    }
}
