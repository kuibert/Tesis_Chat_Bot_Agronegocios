import { AIHandler, AIClient } from "./ai-factory.types";
import { OllamaHandler } from "./handlers/ollama-handler";

export class AIProviderFactory {
  static create(client: AIClient): AIHandler {
    switch (client) {
      case "ollama":
        return new OllamaHandler();
        break;
      case "openai":
        throw new Error("AI handler does not implement");
        break;
      default:
        throw new Error("AI handler does not implement");
    }
  }
}
