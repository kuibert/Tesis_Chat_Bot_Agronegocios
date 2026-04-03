export type AIClient = "ollama" | "openai";
export type StreamHandler = (chunk: string) => void;

export type AIRole = "user" | "system" | "assistant";
export interface Message {
  role: AIRole;
  content: string;
}

export interface AIHandler {
  stream(message: Message | Message[], onChunk: StreamHandler): Promise<void>;
}
