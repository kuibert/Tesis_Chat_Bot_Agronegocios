import { Router } from "express";

import { find, store, getMessages } from "./chat.controller";
import { postChatRequest, getMessagesRequest } from "./chat.request";

import { asyncHandler } from "../../handlers";
import { validateRequest } from "../../middlewares";

const routes = Router();
const PATH = "/chats";

routes.get("/", asyncHandler(find));
routes.post("/", [...postChatRequest], validateRequest, asyncHandler(store));

routes.get(
  "/:chatId/messages",
  [...getMessagesRequest],
  validateRequest,
  asyncHandler(getMessages),
);

export { routes, PATH };
