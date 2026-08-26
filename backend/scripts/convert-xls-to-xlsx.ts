import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

const inputDir = path.join(
  "..",
  "data",
  "Calendarios de Fertilizacion-20260214T220614Z-1-001",
  "Calendarios de Fertilizacion"
);

const run = () => {
  console.log("🚀 Iniciando pre-conversión de .xls a .xlsx...");
  const files = fs.readdirSync(inputDir);
  const xlsFiles = files.filter(f => f.endsWith(".xls"));
  
  console.log(`Encontrados ${xlsFiles.length} archivos .xls para pre-convertir.`);
  
  xlsFiles.forEach(file => {
    const src = path.join(inputDir, file);
    const dest = path.join(inputDir, file.replace(/\.xls$/, ".xlsx"));
    
    try {
      const workbook = XLSX.readFile(src);
      XLSX.writeFile(workbook, dest, { bookType: "xlsx" });
      console.log(`   ✅ Convertido: ${file} -> ${path.basename(dest)}`);
    } catch (e) {
      console.error(`   ❌ Error al convertir ${file}:`, e);
    }
  });
  console.log("✨ Pre-conversión completada.");
};

run();
