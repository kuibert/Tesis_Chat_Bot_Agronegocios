import { Router } from "express";

import * as authRoutes from "../features/auth/auth.routes";
import * as chatRoutes from "../features/chats/chat.routes";

import { Authenticate } from "../middlewares";

const routes = Router();
const PATH = "/api";

routes.use(`${authRoutes.PATH}`, authRoutes.routes);
routes.use(`${chatRoutes.PATH}`, Authenticate, chatRoutes.routes);

routes.get(`/health`, (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Successfully",
  });
});

export { routes, PATH };
