import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

import { chats } from "./chat";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  // Rol: 'user' para el humano, 'assistant' para la IA, 'system' para instrucciones
  role: text("role").$type<"user" | "assistant" | "system">().notNull(),
  content: text("content").notNull(),
  // Para guardar tokens usados, modelo de IA, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
