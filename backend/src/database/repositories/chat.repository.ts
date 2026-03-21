import { chats } from "../schema/chat";
import { messages } from "../schema/message";

import { db } from "../db";
import { eq } from "drizzle-orm";

export const create = async ({
  data,
}: {
  data: { title: string; userId: string };
}) => {
  const [chat] = await db
    .insert(chats)
    .values({ ...data })
    .returning();

  return chat;
};

export const findByUserId = async (userId: string) => {
  const result = await db.select().from(chats).where(eq(chats.userId, userId));

  return result;
};
