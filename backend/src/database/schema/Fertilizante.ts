import { pgTable, uuid, text, real, timestamp, unique, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Catálogo global de fertilizantes — NO se repite por cultivo, se reutiliza entre los 60
export const fertilizantes = pgTable("fertilizantes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: text("nombre").notNull(),
  formula: text("formula"), // ej. "18-46-0"
  precioReferencia: real("precio_referencia"),
  unidad: text("unidad").notNull(), // "Lbs", "Lts", "Gramos"
  n: real("n").default(0),
  p2o5: real("p2o5").default(0),
  k2o: real("k2o").default(0),
  mgo: real("mgo").default(0),
  cao: real("cao").default(0),
  so3: real("so3").default(0),
  b: real("b").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("uq_fertilizantes_nombre").on(table.nombre), // idempotencia
  index("idx_fertilizantes_nombre").on(table.nombre),
]);
