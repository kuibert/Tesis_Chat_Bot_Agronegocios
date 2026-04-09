import { SQL, eq, and } from "drizzle-orm";

import { accounts } from "../schema/Account";
import { users } from "../schema/User";
import { db } from "../db";

export const create = async (data: {
  userId: string;
  provider: "google" | "microsoft" | "local";
  providerAccountId: string;
  type: "oauth" | "other";
  accessToken: string;
}) => {
  const [account] = await db
    .insert(accounts)
    .values({
      userId: data.userId,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      type: data.type,
      accessToken: data.accessToken,
    })
    .returning();
};

export const findUserByAccount = async ({
  provider,
  providerAccountId,
}: {
  provider: "google" | "microsoft" | "local";
  providerAccountId: string;
}) => {
  const [result] = await db
    .select({
      id: users.id,
      image: users.image,
      email: users.email,
      name: users.name,
      accessToken: accounts.accessToken,
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(
      and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1);

  return result ?? null;
};
