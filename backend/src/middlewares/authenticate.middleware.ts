import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../libs/jwt";

import {
  BaseError,
  InvalidCredentials,
  Unauthenticated,
  Unauthorized,
} from "../errors";

const COOKIE_NAME = process.env.COOKIE_NAME!;

export interface AuthRequest extends Request {
  session?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider?: "local" | "google" | "microsoft";
  };
}

export const Authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) throw new Unauthenticated("No autenticado");

    const decoded = verifyToken(token);

    req.session = decoded;

    next();
  } catch (error) {
    if (error instanceof BaseError) {
      return next(error);
    }

    next(new InvalidCredentials("Token invalido o expirado"));
  }
};
