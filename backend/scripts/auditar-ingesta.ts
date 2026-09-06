import path from "path";
import { loadDirectory, fileContent } from "./ingest-directory";

// Códigos de color ANSI para terminal
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

async function runAuditor() {
  const dirPath = process.argv[2] || path.resolve(__dirname, "../../data/csv");
  console.log(`${BOLD}🔍 Iniciando Auditoría de Ingesta ETL en: ${dirPath}${RESET}\n`);

  try {
    const files = await loadDirectory(dirPath);
    console.log(`Archivos encontrados: ${files.length}\n`);

    let countOk = 0;
    let countRevisar = 0;
    let countError = 0;

    const reporte: { archivo: string; estado: string; advertencias: string[] }[] = [];

    for (const file of files) {
      try {
        const resultado = await fileContent(file);
        
        if (resultado.exito && resultado.advertencias.length === 0) {
          countOk++;
          reporte.push({ archivo: file.name, estado: "OK", advertencias: [] });
        } else if (resultado.exito && resultado.advertencias.length > 0) {
          countRevisar++;
          reporte.push({ archivo: file.name, estado: "REVISAR", advertencias: resultado.advertencias });
        } else {
          countError++;
          reporte.push({ archivo: file.name, estado: "ERROR", advertencias: resultado.advertencias });
        }
      } catch (err: any) {
        countError++;
        reporte.push({ archivo: file.name, estado: "ERROR", advertencias: [err.message] });
      }
    }

    console.log(`${BOLD}================= REPORTE FINAL =================${RESET}`);
    console.log(`${GREEN}${countOk} OK${RESET} · ${YELLOW}${countRevisar} necesitan revisión${RESET} · ${RED}${countError} fallaron${RESET}\n`);

    for (const r of reporte) {
      if (r.estado === "REVISAR") {
        console.log(`${YELLOW}[REVISAR]${RESET} ${r.archivo}`);
        r.advertencias.forEach(a => console.log(`   - ${a}`));
      } else if (r.estado === "ERROR") {
        console.log(`${RED}[ERROR]${RESET} ${r.archivo}`);
        r.advertencias.forEach(a => console.log(`   - ${a}`));
      }
    }

    console.log(`\n${BOLD}=================================================${RESET}`);
    console.log(`Auditoría finalizada. Revisa los mensajes para corregir el origen (Excel o CSV).`);
  } catch (error: any) {
    console.error(`${RED}Error fatal ejecutando la auditoría: ${error.message}${RESET}`);
  }
}

runAuditor();
