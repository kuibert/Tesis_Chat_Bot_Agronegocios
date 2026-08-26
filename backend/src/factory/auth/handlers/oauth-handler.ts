import * as accountRepository from "../../../database/repositories/account.repository";
import * as userRepository from "../../../database/repositories/user.respository";

import { AuthHandler, AuthProfile, Session } from "../auth-factory.types";

export class OAuthHandler implements AuthHandler {
  async handle(profile: AuthProfile): Promise<Session> {
    const providerAccountId = profile.id || "";
    const email = profile.email || "";
    const name = profile.name || "";
    const { image, provider, accessToken } = profile;

    const existingAccount = await accountRepository.findUserByAccount({
      provider,
      providerAccountId,
    });

    if (existingAccount) {
      return { ...existingAccount };
    }

    const userDb = await userRepository.findByEmail({ email });

    let session: Session;

    if (!userDb) {
      const newUser = await userRepository.create({
        email,
        name,
        image,
      });

      session = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        image: newUser.image,
      };
    } else {
      session = {
        id: userDb.id,
        email: userDb.email,
        name: userDb.name,
        image: userDb.image,
      };
    }
    
    await accountRepository.create({
      userId: session.id,
      provider,
      providerAccountId,
      accessToken: accessToken ?? "",
      type: "oauth",
    });

    return {
      id: session.id,
      email: session.email,
      name: session.name,
      image: session.image,
      accessToken: accessToken ?? null,
    };
  }
}
