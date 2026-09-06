export type AIClient = "ollama" | "openai";
export type StreamHandler = (chunk: string) => void;
export type MetadataHandler = (metadata: Record<string, unknown>) => void;

export type AIRole = "user" | "system" | "assistant" | "tool";
export interface Message {
  role: AIRole;
  content: string;
  name?: string;
  tool_calls?: any[];
}

export interface AIHandler {
  stream(
    message: Message | Message[],
    onChunk: StreamHandler,
    signal?: AbortSignal,
    onMetadata?: MetadataHandler
  ): Promise<void>;
}
