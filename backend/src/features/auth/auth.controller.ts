import { Request, Response } from "express";
import * as authService from "./auth.service";

export const signIn = async (req: Request, res: Response) => {
  const { provider, ...data } = req.body;
  const result = await authService.authenticate(provider, data);
  res.status(200).json(result);
};
