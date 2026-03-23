import jwt, { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export interface MicrosoftResponse {
  providerAccountId: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
}

const client = jwksClient({
  jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000,  
});
 
const getKey = (header: JwtHeader, callback: any) => {
  client.getSigningKey(header.kid!, (err, key) => {
    if (err) {
      return callback(err, null);
    }

    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

export const verifyMicrosoftToken = async (
  idToken: string,
): Promise<MicrosoftResponse> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ["RS256"],
        audience: process.env.MICROSOFT_CLIENT_ID,
      },
      (err, decoded: any) => {
        if (err) {
          console.error("JWT VERIFY ERROR:", err);
          return reject(new Error("Token inválido de Microsoft"));
        }

        if (!decoded) {
          return reject(new Error("Payload inválido"));
        }

        const validIssuer =
          typeof decoded.iss === "string" &&
          decoded.iss.startsWith("https://login.microsoftonline.com/");

        if (!validIssuer) {
          return reject(new Error("Issuer inválido"));
        }

        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          return reject(new Error("Token expirado"));
        }

        const email =
          decoded.email || decoded.preferred_username || decoded.upn;

        if (!email) {
          return reject(new Error("Email no disponible"));
        }

        resolve({
          providerAccountId: decoded.sub || decoded.oid,
          email,
          name: decoded.name,
          image: null,
          emailVerified: true,
        });
      },
    );
  });
};
