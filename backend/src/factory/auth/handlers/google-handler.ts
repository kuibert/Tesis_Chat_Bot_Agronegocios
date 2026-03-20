import * as accountRepository from "../../../database/repositories/account.repository";
import * as userRepository from "../../../database/repositories/user.respository";

import { AuthHandler, AuthProfile, Session } from "../auth-factory.types";

import { verifyGoogleToken } from "../../../libs/google";
import { InvalidCredentials, BadRequest } from "../../../errors";

export class GoogleHandler implements AuthHandler {
  async handle(profile: AuthProfile): Promise<Session> {
    let session: Session;
    if (!profile.idToken)
      throw new BadRequest("idToken es requerido para Google");

    const googleData = await verifyGoogleToken(profile.idToken);

    if (!googleData.emailVerified)
      throw new InvalidCredentials("Email no verificado por Google");

    const existingAccount = await accountRepository.findUserByAccount({
      provider: "google",
      providerAccountId: googleData.providerAccountId,
    });

    if (existingAccount) {
      return {
        id: existingAccount.id,
        email: existingAccount.email,
        name: existingAccount.name,
        image: existingAccount.image,
        accessToken: existingAccount.accessToken,
      };
    }

    let user = await userRepository.findByEmail({
      email: googleData.email,
    });

    if (!user) {
      const newUser = await userRepository.create({
        email: googleData.email,
        name: googleData.name,
        image: googleData.image,
      });

      session = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        image: newUser.image,
      };
    } else {
      session = {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    }

    await accountRepository.create({
      userId: session.id,
      provider: "google",
      providerAccountId: googleData.providerAccountId,
      type: "oauth",
      accessToken: "",
    });

    return {
      id: session.id,
      email: session.email,
      name: session.name,
      image: session.image,
      accessToken: null,
    };
  }
}
