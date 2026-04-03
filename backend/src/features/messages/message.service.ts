import { Message } from "../../factory/ai/ai-factory.types";
import { AIProviderFactory } from "../../factory/ai/ai-factory";

import * as chatRepository from "../../database/repositories/chat.repository";

const aiProvider = AIProviderFactory.create("ollama");

export const saveMessage = async (
  data: {
    chatId: string;
    content: string;
  },
  onStream: (message: Message & { chatId: string }) => void,
) => {
  const { content, chatId } = data;
  let fullResponse = "";

  if (!chatId) throw Error("The chat id is required.");
  const payload: Message = { content, role: "user" };

  await aiProvider.stream(payload, (chunk) => {
    fullResponse += chunk;
    onStream({
      chatId,
      role: "assistant",
      content: chunk,
    });
  });

  await chatRepository.saveMessageExecute([
    {
      chatId,
      role: "user",
      content: content,
    },
    {
      chatId,
      role: "assistant",
      content: fullResponse,
    },
  ]);
};
