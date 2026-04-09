import * as accountRepository from "../../../database/repositories/account.repository";
import * as userRepository from "../../../database/repositories/user.respository";

import { AuthHandler, AuthProfile, Session } from "../auth-factory.types";

import { verifyMicrosoftToken } from "../../../libs/microsoft";
import { InvalidCredentials, BadRequest } from "../../../errors";

export class MicrosoftHandler implements AuthHandler {
  async handle(profile: AuthProfile): Promise<Session> {
    let session: Session;
    if (!profile.idToken)
      throw new BadRequest("idToken es requerido para Microsoft");

    const msData = await verifyMicrosoftToken(profile.idToken);

    if (!msData.email)
      throw new InvalidCredentials("No se pudo obtener el email de Microsoft");

    const existingAccount = await accountRepository.findUserByAccount({
      provider: "microsoft",
      providerAccountId: msData.providerAccountId,
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
      email: msData.email,
    });

    if (!user) {
      const newUser = await userRepository.create({
        email: msData.email,
        name: msData.name,
        image: msData.image ?? "",
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
      provider: "microsoft",
      providerAccountId: msData.providerAccountId,
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
