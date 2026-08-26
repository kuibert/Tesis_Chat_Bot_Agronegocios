import fs from "fs/promises";
import path from "path";
import officeparser from "officeparser";

/** Tamaño máximo permitido por chunk antes de activar el fallback */
const MAX_CHUNK_SIZE = 1000;
/** Cantidad de caracteres de solapamiento en el fallback */
const FALLBACK_OVERLAP = 100;
/** Longitud mínima para considerar un párrafo como válido */
const MIN_CHUNK_LENGTH = 10;

/**
 * Divide un texto largo usando ventana deslizante con solapamiento.
 */
function naiveChunkWithOverlap(text: string, size: number, overlap: number): string[] {
  const subChunks: string[] = [];
  const step = size - overlap;

  for (let i = 0; i < text.length; i += step) {
    const chunk = text.substring(i, i + size);
    if (chunk.length > MIN_CHUNK_LENGTH) {
      subChunks.push(chunk);
    }
    if (i + size >= text.length) break;
  }

  return subChunks;
}

/**
 * Chunker Semántico (V2) para archivos de texto plano y PDFs.
 */
export function createChunks(text: string, chunkSize = MAX_CHUNK_SIZE, overlap = 0.1): string[] {
  const chunks: string[] = [];

  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > MIN_CHUNK_LENGTH);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      chunks.push(paragraph);
    } else {
      const subChunks = naiveChunkWithOverlap(paragraph, chunkSize, FALLBACK_OVERLAP);
      chunks.push(...subChunks);
    }
  }

  return chunks;
}

/**
 * Resuelve una línea de CSV respetando las comillas dobles y comas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const EXCELS_PATH = path.resolve(__dirname, "../../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion");

async function getOriginalExcelFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(EXCELS_PATH);
    return files.filter(f => [".xls", ".xlsx"].includes(path.extname(f).toLowerCase()));
  } catch (e) {
    console.warn("No se pudo leer la carpeta de Excels originales para mapeo:", e);
    return [];
  }
}

let cachedManifiesto: any = null;
async function getManifiesto(): Promise<any> {
  if (cachedManifiesto) return cachedManifiesto;
  try {
    const manifiestoPath = path.resolve(__dirname, "../../data/manifiesto.json");
    const data = await fs.readFile(manifiestoPath, "utf-8");
    cachedManifiesto = JSON.parse(data);
  } catch (error) {
    console.warn("⚠️ Advertencia: No se pudo cargar data/manifiesto.json. Se usarán metadatos genéricos.");
    cachedManifiesto = { archivos_config: [] };
  }
  return cachedManifiesto;
}

function normalizarNombreColumna(columna: string): string {
  const colClean = columna.toLowerCase().trim();

  if (colClean.includes("map") || colClean.includes("fósforo") || colClean.includes("fosforo")) {
    return "map_lbs";
  }
  if (colClean.includes("nitrato") && colClean.includes("amonio")) {
    return "nitrato_amonio_lbs";
  }
  if (colClean.includes("sulfato") && colClean.includes("amonio")) {
    return "sulfato_amonio_lbs";
  }
  if (colClean.includes("nitrato") && colClean.includes("potasio")) {
    return "nitrato_potasio_lbs";
  }
  if (colClean.includes("sulfato") && colClean.includes("magnesio")) {
    return "sulfato_magnesio_lbs";
  }
  if (colClean.includes("nitrato") && colClean.includes("calcio")) {
    return "nitrato_calcio_lbs";
  }
  if (colClean.includes("solubor") || colClean.includes("boro")) {
    return "solubor_gramos";
  }
  if (colClean.includes("semana")) {
    return "semana";
  }
  if (colClean.includes("ddt")) {
    return "ddt";
  }
  if (colClean.includes("fecha")) {
    return "fecha";
  }
  if (colClean.startsWith("admin_")) {
    return colClean;
  }

  // Cualquier otro insumo -> convertir a minúsculas, quitar caracteres especiales y usar guiones bajos
  return colClean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface fileDirectory {
  path: string;
  name: string;
  extension: string;
}

export interface IngestedFile {
  dataChunks: string[];
  fertilizerListChunk?: {
    content: string;
    sheetName: string;
  };
  extraChunks: Array<{
    content: string;
    type: "formulas" | "validations";
    sheetName: string;
  }>;
}

export const loadDirectory = async (
  directoryPath: string,
): Promise<fileDirectory[]> => {
  const stats = await fs.stat(directoryPath);
  if (!stats.isDirectory()) {
    throw new Error("El path proporcionado no es una carpeta.");
  }

  const files = await fs.readdir(directoryPath);
  const textFiles = files.filter((file) =>
    [".csv", ".txt", ".md", ".pdf", ".docx"].includes(path.extname(file).toLowerCase())
  );

  return textFiles.map((file) => {
    const extension = path.extname(file);
    const nameOnly = path.basename(file, extension);
    return {
      path: directoryPath,
      name: nameOnly,
      extension: extension.replace(".", ""),
    };
  });
};

export const fileContent = async (file: fileDirectory): Promise<IngestedFile> => {
  const extension = `.${file.extension}`;
  const filePath = path.join(file.path, `${file.name}${extension}`);

  if (extension.toLowerCase() === ".csv") {
    // 1. Leer el CSV
    const csvContent = await fs.readFile(filePath, "utf-8");
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return { dataChunks: [], extraChunks: [] };
    }

    // 2. Extraer cabecera y filas
    const headers = parseCSVLine(lines[0]);
    const dataChunks: string[] = [];

    // Mapear nombre de documento original y hoja
    const csvName = file.name; // ej: "Tomate_3000-Gavetas_Invierno_MCA-EDA_Fert_2008-23_2_Por_Sem"
    const originalFiles = await getOriginalExcelFiles();
    
    // Encontrar el stem que sea prefijo del nombre del CSV
    let docName = csvName;
    let sheetName = "Datos";
    
    const sortedFiles = [...originalFiles].sort((a, b) => b.length - a.length);
    for (const filename of sortedFiles) {
      const ext = path.extname(filename);
      const stem = path.basename(filename, ext);
      if (csvName.startsWith(stem + "_")) {
        docName = filename; // NOMBRE_ARCHIVO completo con extensión (ej: "Aguacate_Año-1-a-4_MCA-EDA_Fert_2008-1.xls")
        sheetName = csvName.substring(stem.length + 1).replace(/_/g, " ");
        break;
      }
    }

    // Generar chunk adicional con el catálogo de fertilizantes disponibles en esta hoja con el formato exacto de lista
    const fertilizantesList = headers
      .map(h => h.trim())
      .filter(h => {
        const hLower = h.toLowerCase();
        return (
          h !== "" &&
          hLower !== "semana" &&
          !hLower.startsWith("semana (") &&
          !hLower.startsWith("semana ") &&
          hLower !== "ddt" &&
          !hLower.startsWith("ddt (") &&
          hLower !== "fecha" &&
          !hLower.startsWith("fecha (") &&
          !hLower.includes("cambios") &&
          !hLower.startsWith("admin_") &&
          !hLower.startsWith("columna_") &&
          !hLower.startsWith("unnamed") &&
          !/\_\d+$/.test(h) &&
          !/\.\d+$/.test(h) &&
          !hLower.startsWith("para ") &&
          !hLower.startsWith("calendario ") &&
          !hLower.startsWith("requerimientos ") &&
          !hLower.startsWith("tabla ") &&
          !hLower.startsWith("fase") &&
          !hLower.includes("día después") &&
          !hLower.includes("dia despues") &&
          !hLower.startsWith("relación ") &&
          !hLower.startsWith("relacion ") &&
          !hLower.includes("siembra") &&
          hLower !== "dia" &&
          hLower !== "día"
        );
      })
      .map(h => {
        const match = h.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (match) {
          return `- ${match[1].trim()} (${match[2].trim()})`;
        }
        return `- ${h}`;
      });

    let fertilizerListChunk: { content: string; sheetName: string } | undefined = undefined;
    if (fertilizantesList.length > 0) {
      const listContent = `[Cultivo/Archivo: ${docName}]\nEn el documento ${docName} (hoja: ${sheetName}), los fertilizantes disponibles son:\n${fertilizantesList.join("\n")}`;
      fertilizerListChunk = {
        content: listContent,
        sheetName: sheetName
      };
    }

    const manifiesto = await getManifiesto();
    const metaArchivo = manifiesto.archivos_config?.find(
      (c: any) => c.nombre_archivo === docName || c.nombre_archivo === path.basename(docName) || c.nombre_archivo === file.name || c.nombre_archivo === `${file.name}.xls` || c.nombre_archivo === `${file.name}.xlsx`
    ) || {
      cultivo: file.name.split("_")[0] || "desconocido",
      suelo_recomendado: "general",
      fertilidad_base: "general",
      area_base: "1 manzana"
    };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      const insumos_dosis_por_manzana: Record<string, number> = {};
      let semanaActual: number | string = i;
      let ddtActual: number | string = 0;
      let fechaActual = "";

      headers.forEach((header, idx) => {
        const llaveLimpia = normalizarNombreColumna(header);
        const valorRaw = values[idx];
        if (valorRaw === undefined || valorRaw === null || valorRaw.trim() === "") return;

        const valTrimmed = valorRaw.trim();

        if (llaveLimpia === "semana") {
          const parsed = parseInt(valTrimmed, 10);
          semanaActual = !isNaN(parsed) ? parsed : valTrimmed;
        } else if (llaveLimpia === "ddt") {
          const parsed = parseInt(valTrimmed, 10);
          ddtActual = !isNaN(parsed) ? parsed : valTrimmed;
        } else if (llaveLimpia === "fecha") {
          fechaActual = valTrimmed;
        } else if (!llaveLimpia.startsWith("admin_")) {
          const num = parseFloat(valTrimmed);
          if (!isNaN(num) && num > 0) {
            insumos_dosis_por_manzana[llaveLimpia] = num;
          }
        }
      });

      if (Object.keys(insumos_dosis_por_manzana).length > 0) {
        const objetoFilaJSON: any = {
          semana: semanaActual,
          ddt: ddtActual,
          ...(fechaActual ? { fecha: fechaActual } : {}),
          insumos_dosis_por_manzana
        };

        const nuevoContenidoChunk = `Cultivo/Archivo: ${metaArchivo.cultivo} (${docName})
Contexto Agronómico: Suelo ${String(metaArchivo.suelo_recomendado).replace(/_/g, " ")} | Fertilidad ${metaArchivo.fertilidad_base} | Área Base: ${metaArchivo.area_base} (hoja: ${sheetName})
Datos oficiales de dosificación para la semana:
\`\`\`json
${JSON.stringify(objetoFilaJSON, null, 2)}
\`\`\``.trim();

        dataChunks.push(nuevoContenidoChunk);
      }
    }

    return {
      dataChunks,
      fertilizerListChunk,
      extraChunks: []
    };
  } else if (extension === ".txt" || extension === ".md") {
    const textContent = await fs.readFile(filePath, "utf-8");
    return {
      dataChunks: [textContent],
      extraChunks: []
    };
  } else {
    const ast = await officeparser.parseOffice(filePath);
    const parsedText = ast.toText();
    return {
      dataChunks: [parsedText],
      extraChunks: []
    };
  }
};

export interface DocumentChunk {
  documentId?: string;
  content: string;
  embedding: number[];
  pageNumber: number;
  createdAt?: string;
}

export interface Documents {
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt?: string;
  chunks: DocumentChunk[];
}

async function ingestDirectory(directoryPath: string) {
  try {
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      throw new Error("El path proporcionado no es una carpeta.");
    }

    const files = await fs.readdir(directoryPath);
    const textFiles = files.filter((file) =>
      [".csv", ".txt", ".md", ".pdf", ".docx"].includes(path.extname(file).toLowerCase())
    );

    console.log(`📂 Encontrados ${textFiles.length} archivos válidos en: ${directoryPath}`);

    const results: Documents[] = [];

    for (let index = 0; index < textFiles.length; index++) {
      const file = textFiles[index];
      const filePath = path.join(directoryPath, file);
      const ext = path.extname(file).toLowerCase();

      console.log(`⏳ Procesando: ${file}...`);

      const fileDir: fileDirectory = {
        path: directoryPath,
        name: path.basename(file, ext),
        extension: ext.replace(".", "")
      };

      const resultFile = await fileContent(fileDir);
      
      const isCsv = ext === ".csv";
      const rawChunks = isCsv
        ? resultFile.dataChunks
        : createChunks(resultFile.dataChunks.join("\n"), 1000, 0.1);

      const allChunks = [
        ...rawChunks,
        ...resultFile.extraChunks.map(ec => ec.content)
      ];

      console.log(`📄 Archivo: ${file} -> Dividido en ${allChunks.length} chunks.`);

      results.push({
        fileName: file,
        fileUrl: filePath,
        fileType: ext,
        chunks: [],
      });

      for (let jindex = 0; jindex < allChunks.length; jindex++) {
        const chunkText = allChunks[jindex];
        const { vector } = await embeddingService.generateEmbedding(chunkText);

        results[index].chunks.push({
          content: chunkText,
          embedding: vector,
          pageNumber: jindex,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("❌ Error en la ingesta:", error);
    throw error;
  }
}

// Declaración placeholder para evitar lints si no se usa
const embeddingService = {
  generateEmbedding: async (text: string) => {
    return { vector: [] };
  }
};

export { ingestDirectory };
