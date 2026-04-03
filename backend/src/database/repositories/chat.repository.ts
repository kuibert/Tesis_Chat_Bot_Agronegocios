import { chats } from "../schema/chat";
import { messages } from "../schema/message";

import { db } from "../db";
import { eq, InferInsertModel } from "drizzle-orm";

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

type NewMessage = InferInsertModel<typeof messages>;

export const addMessage = async (messageData: NewMessage) => {
  const [message] = await db
    .insert(messages)
    .values({
      ...messageData,
    })
    .returning();

  return message;
};

export const saveMessage = async (data: NewMessage, tx: any = db) => {
  return await tx.insert(messages).values({
    ...data,
    createdAt: new Date(),
  });
};

export const saveManyMessage = async (data: NewMessage[], tx: any = db) => {
  return await tx.insert(messages).values(data).returning();
};

export const saveMessageExecute = async (data: NewMessage | NewMessage[]) => {
  const values = Array.isArray(data) ? data : [data];

  await db.transaction(async (tx) => {
    await tx.insert(messages).values(values).returning();
  });
};
