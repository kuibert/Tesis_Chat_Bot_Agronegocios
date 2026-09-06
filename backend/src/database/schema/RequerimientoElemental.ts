import { pgTable, uuid, text, integer, real, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cultivos } from "./Cultivo";

// Requerimiento elemental por hectárea/día/fase — de la hoja "Req. Diario"
// Es la fuente de verdad: área-independiente, funciona para cualquier tamaño de parcela
export const requerimientoElemental = pgTable("requerimiento_elemental", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cultivoId: uuid("cultivo_id").notNull().references(() => cultivos.id, { onDelete: "cascade" }),
  fase: text("fase"),
  diaDespuesSiembra: integer("dia_despues_siembra").notNull(),
  semana: integer("semana"),
  n: real("n").notNull().default(0),
  p2o5: real("p2o5").notNull().default(0),
  k2o: real("k2o").notNull().default(0),
  mgo: real("mgo").default(0),
  ca: real("ca").default(0),
  bGramosHa: real("b_gramos_ha").default(0),
}, (table) => [
  index("idx_requerimiento_cultivo_dia").on(table.cultivoId, table.diaDespuesSiembra),
]);
