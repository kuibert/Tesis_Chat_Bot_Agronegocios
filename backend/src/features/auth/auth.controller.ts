import { Request, Response } from "express";

import * as authService from "./auth.service";

import { signToken } from "../../libs/jwt";
import { setAuthCookie, clearAuthCookie } from "../../libs/cookies";

import { AuthRequest } from "../../middlewares";

export const sigInLocal = async (req: Request, res: Response) => {
  const { body } = req;

  const session = await authService.authenticate("local", body);

  const token = signToken({
    id: session.id,
    email: session.email,
    name: session.name!,
    avatar: session.image ?? "",
    provider: "local"
  });
  setAuthCookie(res, token);

  res.status(200).json({
    ok: true,
    message: "Successfully",
    code: "SIGN_IN_LOCAL",
  });
};

export const sigInOauth = async (req: Request, res: Response) => {
  const { provider, idToken } = req.body;

  const session = await authService.authenticate(provider, {
    provider,
    idToken,
  });

  const token = signToken({
    id: session.id,
    email: session.email,
    name: session.name!,
    avatar: session.image ?? "",
    provider,
  });
  setAuthCookie(res, token);

  res.status(200).json({
    ok: true,
    message: "Successfully",
    code: "SIGN_IN_PROVIDER",
  });
};

export const signOut = (req: Request, res: Response) => {
  clearAuthCookie(res);

  res.status(200).json({
    ok: true,
    message: "Successfully",
    code: "SIGN_OUT",
  });
};

export const profile = (req: AuthRequest, res: Response) => {
  const { session } = req;
  res.status(200).json({
    ...session,
  });
};
