import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  customType,
} from "drizzle-orm/pg-core";
import { documents } from "./document";

const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown) {
    if (typeof value !== "string") return [];
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseFloat(v));
  },
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding"),
  pageNumber: integer("page_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
