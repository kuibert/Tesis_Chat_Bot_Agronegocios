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
});

const getKey = (header: JwtHeader, callback: any) => {
  client.getSigningKey(header.kid!, (err, key) => {
    if (err) {
      callback(err, null);
      return;
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
        issuer: "https://login.microsoftonline.com/common/v2.0",
      },
      (err, decoded: any) => {
        if (err) {
          return reject(new Error("Token inválido de Microsoft"));
        }

        if (!decoded) {
          return reject(new Error("Payload inválido"));
        }

        resolve({
          providerAccountId: decoded.sub || decoded.oid,
          email: decoded.email || decoded.preferred_username,
          name: decoded.name,
          image: null,
          emailVerified: true,
        });
      },
    );
  });
};
