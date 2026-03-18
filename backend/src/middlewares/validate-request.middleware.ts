import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};

    result.array().forEach((error: any) => {
      const field = error.path || error.param;

      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }

      formattedErrors[field].push(error.msg);
    });

    const err: any = new Error("The given data was invalid.");
    err.status = 422; // Laravel usa 422
    err.errors = formattedErrors;

    return next(err);
  }

  next();
};
