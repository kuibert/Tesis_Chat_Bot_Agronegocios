import fs from "fs/promises";
import * as XLSX from "xlsx";
import path from "path";
import officeparser from "officeparser";

import { embeddingService } from "../src/services/embeddingService"; // Ajusta la ruta

/**
 * Divide un texto largo en pedazos (chunks) manejables.
 * @param text Texto completo del archivo.
 * @param chunkSize Tamaño máximo de caracteres por pedazo (~500).
 * @param overlap Porcentaje de solapamiento (0.1 = 10%).
 */
export function createChunks(
  text: string,
  chunkSize: number = 500,
  overlap: number = 0.1,
): string[] {
  const chunks: string[] = [];
  const step = Math.floor(chunkSize * (1 - overlap));

  for (let i = 0; i < text.length; i += step) {
    const chunk = text.substring(i, i + chunkSize);
    if (chunk.length > 10) {
      // Evitar pedazos vacíos o muy cortos
      chunks.push(chunk);
    }
    // Si ya llegamos al final del texto, detenemos el bucle
    if (i + chunkSize >= text.length) break;
  }

  return chunks;
}

function worksheetToMarkdown(worksheet: XLSX.WorkSheet): string {
  const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (json.length === 0) return "";

  const [headers, ...rows] = json;

  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

  const bodyRows = rows
    .map(
      (row) =>
        `| ${row.map((cell) => (cell !== undefined && cell !== null ? cell : "")).join(" | ")} |`,
    )
    .join("\n");

  return `${headerRow}\n${separatorRow}\n${bodyRows}`;
}

interface DocumentChunk {
  documentId?: string;
  content: string;
  embedding: number[];
  pageNumber: number;
  createdAt?: string;
}

interface Documents {
  fileName: string;
  fileUrl: string;
  fileType: string; // pdf, txt, docx
  createdAt?: string;

  chunks: DocumentChunk[];
}

const allowedExtensions = [
  ".txt",
  ".md",
  ".csv",
  ".xls",
  ".xlsx",
  ".docx",
  ".pptx",
];

interface fileDirectory {
  path: string;
  name: string;
  extension: string;
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
    allowedExtensions.includes(path.extname(file).toLowerCase()),
  );

  console.log(
    `Encontrados ${textFiles.length} archivos válidos en: ${directoryPath}`,
  );

  const mapper = textFiles.map<fileDirectory>((file) => {
    const extension = path.extname(path.join(directoryPath, file));
    const nameOnly = path.basename(path.join(directoryPath, file), extension);

    return {
      path: directoryPath,
      name: nameOnly,
      extension: extension.replace(".", ""),
    };
  });

  return mapper;
};

export const fileContent = async (file: fileDirectory) => {
  const extension = `.${file.extension}`;
  const filePath = path.join(file.path, `${file.name}${extension}`);

  let fileContent;

  if (extension === ".txt" || extension === ".md") {
    fileContent = await fs.readFile(filePath, "utf-8");
  } else if ([".xls"].includes(extension)) {
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    let fullTableText = "";

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];

      const markdownTable = worksheetToMarkdown(worksheet);
      fullTableText += `\n### Hoja: ${sheetName}\n${markdownTable}\n`;
    });
    fileContent = fullTableText;
  } else {
    const ast = await officeparser.parseOffice(filePath);
    fileContent = ast.toText();
  }

  const cleanContent = fileContent
    .split("\n")
    .filter((line) => line.replace(/[| ]/g, "").length > 0)
    .join("\n");

  return cleanContent;
};

async function ingestDirectory(directoryPath: string) {
  try {
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      throw new Error("El path proporcionado no es una carpeta.");
    }

    const files = await fs.readdir(directoryPath);
    const textFiles = files.filter((file) =>
      allowedExtensions.includes(path.extname(file).toLowerCase()),
    );

    console.log(
      `📂 Encontrados ${textFiles.length} archivos válidos en: ${directoryPath}`,
    );

    const results: Documents[] = [];

    for (let index = 0; index < textFiles.length; index++) {
      const file = textFiles[index];

      const filePath = path.join(directoryPath, file);
      const fileStats = await fs.stat(filePath);
      const ext = path.extname(file).toLowerCase();

      let fileContent;

      console.log(`⏳ Procesando: ${file}...`);

      if (ext === ".txt" || ext === ".md") {
        fileContent = await fs.readFile(filePath, "utf-8");
      } else if ([".xls"].includes(ext)) {
        const fileBuffer = await fs.readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        let fullTableText = "";

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];

          const markdownTable = worksheetToMarkdown(worksheet);
          fullTableText += `\n### Hoja: ${sheetName}\n${markdownTable}\n`;
        });
        fileContent = fullTableText;
      } else {
        const ast = await officeparser.parseOffice(filePath);
        fileContent = ast.toText();
      }

      const cleanContent = fileContent
        .split("\n")
        .filter((line) => line.replace(/[| ]/g, "").length > 0)
        .join("\n");

      const chunks = createChunks(cleanContent, 1000, 0.1);

      console.log(
        `📄 Archivo: ${file} -> Dividido en ${chunks.length} chunks.`,
      );

      results.push({
        fileName: file,
        fileUrl: filePath,
        fileType: path.extname(file),
        chunks: [],
      });

      for (let jindex = 0; jindex < chunks.length; jindex++) {
        const chunkText = chunks[jindex];
        console.log(`⏳ Procesando: chunk ${jindex}...`);
        const { vector } = await embeddingService.generateEmbedding(chunkText);

        console.log(
          `📄 chunk: ${jindex} cargado de ${chunks.length}, faltan ${chunks.length - jindex}`,
        );

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

export { ingestDirectory, DocumentChunk, Documents };
