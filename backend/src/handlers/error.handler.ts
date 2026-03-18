import { Request, Response, NextFunction } from "express";

import { BaseError } from "../errors";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  if (err instanceof BaseError) {
    return res.status(err.status).json({
      ok: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
  }

  return res.status(500).json({
    ok: false,
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  });
};
