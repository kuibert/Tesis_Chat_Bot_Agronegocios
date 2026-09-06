import { pgTable, uuid, text, real, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { cultivos } from "./Cultivo";

// Agroquímicos preventivos (nematicidas, etc.) — separados de fertilizantes, no son nutrición
export const controlesPreventivos = pgTable("controles_preventivos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cultivoId: uuid("cultivo_id").notNull().references(() => cultivos.id, { onDelete: "cascade" }),
  tipoControl: text("tipo_control").notNull(),
  producto: text("producto").notNull(),
  precio: real("precio"),
  dosisPorHectarea: real("dosis_por_hectarea"),
  unidades: text("unidades"),
}, (table) => [
  index("idx_preventivos_cultivo").on(table.cultivoId),
]);
