import { Response } from "express";

const COOKIE_NAME = process.env.COOKIE_NAME!;

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME);
};
