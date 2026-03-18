import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../schema/User";

export const create = async (data: {
  name: string;
  email: string;
  password?: string;
  image?: string;
}) => {
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      image: data.image,
      passwordHash: data.password,
      isActive: true,
      emailVerified: new Date(),
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
    });

  return user;
};

export const findByEmail = async ({ email }: { email: string }) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
};
