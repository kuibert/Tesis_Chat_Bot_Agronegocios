import { Response, Request } from "express";

import * as chatService from "./chat.service";
import { AuthRequest } from "../../middlewares";

export const find = async (req: AuthRequest, res: Response) => {
  const { session } = req;
  const chats = await chatService.findBySessionId(session!.id);
  res.status(200).json(chats);
};

export const store = async (req: AuthRequest, res: Response) => {
  const { body, session } = req;

  const chat = await chatService.create({
    data: { title: body.title, userId: session!.id },
  });

  res.status(201).json({
    ...chat,
  });
};

export const getMessages = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { limit: queryLimit, offset: queryOffset } = req.query;

  const limit = queryLimit ? parseInt(queryLimit.toString()) : 15;
  const offset = queryOffset ? parseInt(queryOffset.toString()) : 0;

  const result = await chatService.getChatHistory(chatId, limit, offset);

  res.json(result);
};
