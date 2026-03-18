import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${message}`);

  res.status(status).json({
    ok: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};
