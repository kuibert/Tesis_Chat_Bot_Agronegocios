import { AuthHandler, AuthLocalProfile, Session } from "../auth-factory.types";

import * as userRepository from "../../../database/repositories/user.respository";

export class LocalHandler implements AuthHandler {
  async handle(profile: AuthLocalProfile): Promise<Session> {
    const { email } = profile;

    const user = await userRepository.findByEmail({ email });

    if (user) {
      if (!user.passwordHash)
        throw new Error(
          "Este email está vinculado a una cuenta social. Inicia sesión con Google o Microsoft.",
        );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        accessToken: profile.accessToken,
      };
    } else {
      const { provider, id, accessToken, ...data } = profile;

      const newUser = await userRepository.create({ ...data });

      return { ...newUser, accessToken };
    }
  }
}
