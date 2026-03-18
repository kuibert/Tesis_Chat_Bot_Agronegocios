import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

import { Validation } from "../errors";

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

    return next(new Validation(formattedErrors));
  }

  next();
};
