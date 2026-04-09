import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"), // pdf, txt, docx
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
