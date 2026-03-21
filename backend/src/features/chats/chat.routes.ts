import { Router } from "express";

import { find, store } from "./chat.controller";
import { postChatRequest } from "./chat.request";

import { asyncHandler } from "../../handlers";
import { validateRequest } from "../../middlewares";

const routes = Router();
const PATH = "/chats";

routes.get("/", asyncHandler(find));
routes.post("/", [...postChatRequest], validateRequest, asyncHandler(store));

export { routes, PATH };
