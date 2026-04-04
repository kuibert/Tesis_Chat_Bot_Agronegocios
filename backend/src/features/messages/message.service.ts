import { Message } from "../../factory/ai/ai-factory.types";
import { AIProviderFactory } from "../../factory/ai/ai-factory";

import * as chatRepository from "../../database/repositories/chat.repository";

const aiProvider = AIProviderFactory.create("ollama");

export const saveMessage = async (
  data: { chatId: string; content: string },
  onListen: (msg: any) => void,
  onStream: (chunk: string, messageId: string) => void,
) => {
  const { content, chatId } = data;

  if (!chatId) throw Error("The chat id is required.");
 
  const { userMsg, assistantMsg } = await chatRepository.transaction(
    async (tx) => {
      const userMsg = await chatRepository.saveMessage(
        { chatId, role: "user", content },
        tx,
      );

      const assistantMsg = await chatRepository.saveMessage(
        { chatId, role: "assistant", content: "" }, 
        tx,
      );

      return { userMsg, assistantMsg };
    },
  );
 
  onListen(userMsg);
  onListen(assistantMsg);
 
  let fullResponse = "";
  const payload: Message = { content, role: "user" };

  await aiProvider.stream(payload, (chunk) => {
    fullResponse += chunk; 
    onStream(chunk, assistantMsg.id);
  });
 
  await chatRepository.updateMessage({
    messageId: assistantMsg.id,
    content: fullResponse,
  });
};
