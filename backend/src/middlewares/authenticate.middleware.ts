import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../libs/jwt";

import { BaseError, InvalidCredentials, Unauthorized } from "../errors";

const COOKIE_NAME = process.env.COOKIE_NAME!;

export interface AuthRequest extends Request {
  session?: {
    id: string;
    email: string;
  };
}

export const Authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) throw new Unauthorized("No autenticado");

    const decoded = verifyToken(token);

    req.session = decoded;

    next();
  } catch (error) {
    if (error instanceof BaseError) {
      next(error);
    }

    throw new InvalidCredentials("Token invalido o expirado");
  }
};
