import { pgTable, uuid, text, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cultivos } from "./Cultivo";
import { fertilizantes } from "./Fertilizante";

// Qué producto comercial usa cada cultivo como fuente de cada elemento (N, P2O5, K2O...)
export const fuenteFertilizanteCultivo = pgTable("fuente_fertilizante_cultivo", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cultivoId: uuid("cultivo_id").notNull().references(() => cultivos.id, { onDelete: "cascade" }),
  elemento: text("elemento").notNull(), // "N" | "P2O5" | "K2O" | "MgO" | "Ca" | "B"
  fertilizanteId: uuid("fertilizante_id").notNull().references(() => fertilizantes.id),
}, (table) => [
  index("idx_fuente_cultivo_elemento").on(table.cultivoId, table.elemento),
]);
