import { AuthHandler, AuthLocalProfile, Session } from "../auth-factory.types";

import * as userRepository from "../../../database/repositories/user.respository";
import { Password } from "../../../value-objects";

import { InvalidCredentials, Conflict } from "../../../errors";

export class LocalHandler implements AuthHandler {
  async handle(profile: AuthLocalProfile): Promise<Session> {
    const { email } = profile;

    const user = await userRepository.findByEmail({ email });
    const password = Password.create(profile.password);

    if (user) {
      if (!user.passwordHash)
        throw new Conflict(
          "Este email está vinculado a una cuenta social. Inicia sesión con Google o Microsoft.",
        );

      const isMatch = await password.compare(user.passwordHash);
      if (!isMatch) throw new InvalidCredentials("Credenciales inválidas.");

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        accessToken: profile.accessToken,
      };
    } else {
      const { provider, id, accessToken, ...data } = profile;

      const hashedPassword = await password.getHashedValue();
      const newUser = await userRepository.create({
        ...data,
        password: hashedPassword,
      });

      return { ...newUser };
    }
  }
}
