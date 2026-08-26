import { db } from "../src/database/db";
import { sql } from "drizzle-orm";

async function truncate() {
  console.log("⏳ Vaciando tablas: documents y document_chunks...");
  await db.execute(sql`TRUNCATE TABLE document_chunks CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE documents CASCADE;`);
  console.log("✅ Tablas vaciadas con éxito.");
  process.exit(0);
}

truncate().catch((err) => {
  console.error("❌ Error al vaciar la base de datos:", err);
  process.exit(1);
});
