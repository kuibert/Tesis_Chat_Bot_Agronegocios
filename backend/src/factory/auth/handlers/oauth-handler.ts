import * as accountRepository from "../../../database/repositories/account.repository";
import * as userRepository from "../../../database/repositories/user.respository";

import { AuthHandler, AuthProfile, Session } from "../auth-factory.types";

export class OAuthHandler implements AuthHandler {
  async handle(profile: AuthProfile): Promise<Session> {
    const { id, provider, accessToken, ...user } = profile;

    const session = await accountRepository.findUserByAccount({
      provider: profile.provider,
      providerAccountId: profile.id,
    });

    if (session) return session;

    const newUser = await userRepository.create({ ...user });

    return session;

    // return profile;
    // // 1. Buscar cuenta existente
    // const existingAccount = await db.query.accounts.findFirst({
    //   where: (acc, { and, eq }) => and(
    //     eq(acc.provider, profile.provider),
    //     eq(acc.providerAccountId, profile.id)
    //   ),
    // });
    // if (existingAccount) return existingAccount.userId;
    // // 2. Buscar o crear usuario (Lógica común)
    // let user = await db.query.users.findFirst({
    //   where: (u, { eq }) => eq(u.email, profile.email),
    // });
    // if (!user) {
    //   [user] = await db.insert(users).values({
    //     email: profile.email,
    //     name: profile.name,
    //     image: profile.image,
    //     emailVerified: new Date(),
    //   }).returning();
    // }
    // // 3. Vincular cuenta
    // await db.insert(accounts).values({
    //   userId: user!.id,
    //   provider: profile.provider,
    //   providerAccountId: profile.id,
    //   type: "oauth",
    //   access_token: profile.accessToken,
    // });
    // return user!.id;
  }
}
