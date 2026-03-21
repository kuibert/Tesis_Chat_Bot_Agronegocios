import { Router } from "express";
import { profile, sigInLocal, sigInOauth, signOut } from "./auth.controller";
import { loginLocalRequest, loginOAuthRequest } from "./auth.request";

import { validateRequest, Authenticate } from "../../middlewares";
import { asyncHandler } from "../../handlers";

const routes = Router();
const PATH = "/auth";

routes.get("/profile", Authenticate, asyncHandler(profile));
routes.post(
  "/login/local",
  [...loginLocalRequest],
  validateRequest,
  asyncHandler(sigInLocal),
);

routes.post(
  "/login/oauth",
  [...loginOAuthRequest],
  validateRequest,
  asyncHandler(sigInOauth),
);

routes.post("/logout", Authenticate, asyncHandler(signOut));

export { PATH, routes };
