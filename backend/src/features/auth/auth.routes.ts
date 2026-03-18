import { Router } from "express";
import { signIn } from "./auth.controller";
import { loginRequest } from "./auth.request";

import { validateRequest } from "../../middlewares";
import { asyncHandler } from "../../handlers";

const routes = Router();
const PATH = "/auth";

routes.post("/login", [...loginRequest], validateRequest, asyncHandler(signIn));

export { PATH, routes };
