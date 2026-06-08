import { Router } from "express";

import { find, store, getMessages, remove, clearHistory, rename } from "./chat.controller";
import { postChatRequest, getMessagesRequest, patchChatRequest } from "./chat.request";

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

routes.delete("/:chatId", asyncHandler(remove));
routes.delete("/:chatId/messages", asyncHandler(clearHistory));

routes.patch("/:chatId", [...patchChatRequest], validateRequest, asyncHandler(rename));

export { routes, PATH };
