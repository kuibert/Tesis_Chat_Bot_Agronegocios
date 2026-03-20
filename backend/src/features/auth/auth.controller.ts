import { Request, Response } from "express";
import * as authService from "./auth.service";

export const sigInLocal = async (req: Request, res: Response) => {
  const { body } = req;

  const result = await authService.authenticate("local", body);

  res.status(200).json(result);
};

export const sigInOauth = async (req: Request, res: Response) => {
  const { provider, idToken } = req.body;

  const result = await authService.authenticate(provider, {
    provider,
    idToken,
  });

  res.status(200).json(result);
};
