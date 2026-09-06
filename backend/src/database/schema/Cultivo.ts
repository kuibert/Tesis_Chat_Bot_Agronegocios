import { pgTable, uuid, text, integer, jsonb, timestamp, unique, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const cultivos = pgTable("cultivos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  variedad: text("variedad"),
  tipoRiego: text("tipo_riego").notNull().default("no_especificado"),
  cicloDias: integer("ciclo_dias"),
  esPerenne: integer("es_perenne").default(0), // 0/1 — Café y Aguacate en tus datos reales
  fuenteArchivo: text("fuente_archivo"), // trazabilidad al Excel de origen, ej. "Bangaña_MCA-EDA_Fert_2008-23.xls"
  advertenciasIngesta: jsonb("advertencias_ingesta"), // lo que reportó el auditor al extraerlo
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("uq_cultivos_fuente_archivo").on(table.fuenteArchivo), // clave de idempotencia por archivo de origen
  index("idx_cultivos_nombre").on(table.nombre),
]);
