import { execSync } from "child_process";

const runCommand = (command: string, stepName: string) => {
  console.log(`\n🚀 ${stepName}...`);
  console.log(`   Ejecutando: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`\n❌ Error crítico en el paso: ${stepName}`);
    process.exit(1);
  }
};

const main = () => {
  // Paso 1: Pre-conversión de archivos .xls a .xlsx
  runCommand("npx tsx scripts/convert-xls-to-xlsx.ts", "Paso 1/4: Convirtiendo .xls a .xlsx");

  // Paso 2: Conversión a CSV con Python
  runCommand("python scripts/convertir_excels_a_csv.py", "Paso 2/4: Convirtiendo a CSV con Python");

  // Paso 3: Limpieza de base de datos (truncado de tablas)
  runCommand("npx tsx scripts/truncate-db.ts", "Paso 3/4: Limpiando base de datos (truncado de tablas)");

  // Paso 4: Ingesta de datos desde CSV
  runCommand("npm run data:ingest", "Paso 4/4: Ingestando datos desde CSV");

  console.log("\n✅ Ingesta completa. La base de datos está lista.");
};

main();
