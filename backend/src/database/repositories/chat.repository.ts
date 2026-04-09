import { chats } from "../schema/chat";
import { messages } from "../schema/message";

import { db } from "../db";
import { eq, InferInsertModel, asc, sql, desc } from "drizzle-orm";

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
  const [message] = await tx
    .insert(messages)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();

  return message;
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

export const findMessageByChatId = async (
  chatId: string,
  limit = 50,
  offset = 0,
) => {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
};

export const countMessageByChatId = async (chatId: string) => {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.chatId, chatId));

  return result[0]?.count || 0;
};

export const transaction = async <T>(promise: (tx: any) => Promise<T>): Promise<T> => {
  return await db.transaction(async (tx) => {
    return await promise(tx);
  });
};

export const updateMessage = async (
  messageData: {
    messageId: string;
    content: string;
  },
  tx: any = db,
) => {
  const [message] = await tx
    .update(messages)
    .set({ content: messageData.content })
    .where(eq(messages.id, messageData.messageId))
    .returning();

  return message;
};
