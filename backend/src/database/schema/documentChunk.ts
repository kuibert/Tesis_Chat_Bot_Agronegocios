import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  customType,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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
  sourceName: text("source_name"),
  metadata: jsonb("metadata").$type<{ chunk_type?: string; unidad_origen?: 'ha' | 'mz'; frecuencia_riego?: string; cultivo?: string }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  frecuenciaIdx: index('idx_document_chunks_frecuencia').on(sql`(metadata->>'frecuencia_riego')`),
  cultivoIdx: index('idx_document_chunks_cultivo').on(sql`(metadata->>'cultivo')`),
}));
