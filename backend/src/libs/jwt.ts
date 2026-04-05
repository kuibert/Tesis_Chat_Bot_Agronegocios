import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

interface Session {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: "local" | "google" | "microsoft";
}

export const signToken = (payload: Session) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as Session;
};
