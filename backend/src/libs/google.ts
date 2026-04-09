import { OAuth2Client } from "google-auth-library";
import { InvalidCredentials } from "../errors";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken: string) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) throw new InvalidCredentials("Token inválido");

  return {
    providerAccountId: payload.sub,
    email: payload.email!,
    name: payload.name!,
    image: payload.picture,
    emailVerified: payload.email_verified,
  };
};
