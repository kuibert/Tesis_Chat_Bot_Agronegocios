// backend/scripts/ingest-structured.ts
//
// Carga *_Req._Diario.csv y *_Fertilizantes.csv a las tablas relacionales.
// NO pasa por embeddingService — estos datos son numéricos, van a SQL, no a document_chunks.

import path from "path";
import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { db } from "../src/database/db";
import { cultivos } from "../src/database/schema/Cultivo";
import { fertilizantes } from "../src/database/schema/Fertilizante";
import { requerimientoElemental } from "../src/database/schema/RequerimientoElemental";
import { fuenteFertilizanteCultivo } from "../src/database/schema/FuenteFertilizanteCultivo";
import { eq } from "drizzle-orm";

const CSV_DIR = path.resolve(__dirname, "../../data/csv");

// ---------------------------------------------------------------------------
// 1. Utilidades
// ---------------------------------------------------------------------------

/** "Bangaña_MCA-EDA_Fert_2008-23_Req._Diario.csv" -> "Bangaña" */
function extraerNombreCultivo(nombreArchivoCsv: string): string {
  const stem = nombreArchivoCsv
    .replace(/_Req\._Diario\.csv$/i, "")
    .replace(/_Fertilizantes\.csv$/i, "");
  const corte = stem.search(/_MCA|_Fert_/i);
  return (corte > 0 ? stem.slice(0, corte) : stem).replace(/_/g, " ").trim();
}

/** Extrae el "stem" completo del nombre de archivo original, ej. "Bangaña_MCA-EDA_Fert_2008-23" */
function extraerStemArchivo(nombreArchivoCsv: string, sufijo: RegExp): string {
  return nombreArchivoCsv.replace(sufijo, "");
}

function numOrNull(v: string | number | undefined | null): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/** Quita tildes y baja a minúsculas — mismo criterio usado en normalizeFrequency.ts */
function normalizarHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Construye un mapa header-normalizado -> header-real, para lookup case/tilde-insensitive */
function mapaHeaders(headers: string[]): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const h of headers) mapa.set(normalizarHeader(h), h);
  return mapa;
}

// ---------------------------------------------------------------------------
// 2. Parseo de Req._Diario.csv
// ---------------------------------------------------------------------------

type FilaRequerimiento = {
  fase: string | null;
  diaDespuesSiembra: number;
  semana: number | null;
  n: number;
  p2o5: number;
  k2o: number;
  mgo: number;
  ca: number;
  bGramosHa: number;
};

function parsearReqDiario(contenidoCsv: string): FilaRequerimiento[] {
  let lineas = contenidoCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lineas.length === 0) return [];

  // Buscar la línea donde realmente comienzan los encabezados (debe tener 'dia' o 'ddt' junto a nutrientes o siembra)
  const headerIndex = lineas.findIndex((l) => {
    const n = normalizarHeader(l);
    return (n.includes("dia") || n.includes("ddt")) && (n.includes("siembra") || n.includes("p2o5") || n.includes("k20") || n.includes("k2o") || n.includes(",n,") || n.includes(",n"));
  });

  if (headerIndex > 0) {
    lineas = lineas.slice(headerIndex);
  }

  const registros: Record<string, string>[] = parse(lineas.join("\n"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  if (registros.length === 0) return [];

  const headersReales = Object.keys(registros[0]);
  const mapa = mapaHeaders(headersReales);

  // Sinónimos normalizados
  const col = {
    dia:
      mapa.get("dia despues siembra") ??
      mapa.get("dia despues de siembra") ??
      mapa.get("dia") ??
      mapa.get("ddt") ??
      mapa.get("dias"),
    fase: mapa.get("fase"),
    semana: mapa.get("semana") ?? mapa.get("sem"),
    n: mapa.get("n") ?? mapa.get("nitrogeno"),
    p2o5: mapa.get("p2o5") ?? mapa.get("p205") ?? mapa.get("fosforo"),
    k2o: mapa.get("k2o") ?? mapa.get("k20") ?? mapa.get("potasio"),
    mgo: mapa.get("mgo") ?? mapa.get("mg0") ?? mapa.get("magnesio"),
    ca: mapa.get("ca") ?? mapa.get("cao") ?? mapa.get("calcio"),
    b: mapa.get("b gramos/ha") ?? mapa.get("b gramos/ha") ?? mapa.get("b") ?? mapa.get("boro"),
  };

  if (!col.dia) {
    console.warn(`    ⚠️  No se encontró columna "Día Después Siembra" (headers reales: ${headersReales.join(", ")})`);
    return [];
  }

  return registros
    .map((r) => {
      const dia = numOrNull(r[col.dia!]);
      if (dia === null) return null;
      return {
        fase: col.fase ? r[col.fase]?.trim() || null : null,
        diaDespuesSiembra: Math.round(dia),
        semana: col.semana && numOrNull(r[col.semana]) ? Math.round(numOrNull(r[col.semana])!) : null,
        n: col.n ? numOrNull(r[col.n]) ?? 0 : 0,
        p2o5: col.p2o5 ? numOrNull(r[col.p2o5]) ?? 0 : 0,
        k2o: col.k2o ? numOrNull(r[col.k2o]) ?? 0 : 0,
        mgo: col.mgo ? numOrNull(r[col.mgo]) ?? 0 : 0,
        ca: col.ca ? numOrNull(r[col.ca]) ?? 0 : 0,
        bGramosHa: col.b ? numOrNull(r[col.b]) ?? 0 : 0,
      };
    })
    .filter((f): f is FilaRequerimiento => f !== null);
}

// ---------------------------------------------------------------------------
// 3. Parseo de Fertilizantes.csv (catálogo)
// ---------------------------------------------------------------------------

type FilaFertilizante = {
  nombre: string;
  formula: string | null;
  precioReferencia: number | null;
  unidad: string;
  n: number;
  p2o5: number;
  k2o: number;
  mgo: number;
  cao: number;
  so3: number;
  b: number;
};

function parsearFertilizantes(contenidoCsv: string): FilaFertilizante[] {
  const registros: Record<string, string>[] = parse(contenidoCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return registros
    .filter((r) => r["nombre"]?.trim())
    .map((r) => ({
      nombre: r["nombre"].trim(),
      formula: r["formula"]?.trim() || null,
      precioReferencia: numOrNull(r["precio"]),
      unidad: r["unidad"]?.trim() || "Lbs",
      n: numOrNull(r["n"]) ?? 0,
      p2o5: numOrNull(r["p2o5"]) ?? 0,
      k2o: numOrNull(r["k2o"]) ?? 0,
      mgo: numOrNull(r["mgo"]) ?? 0,
      cao: numOrNull(r["cao"]) ?? 0,
      so3: numOrNull(r["so3"]) ?? 0,
      b: numOrNull(r["b"]) ?? 0,
    }));
}

/** Inserta o actualiza en el catálogo global — mismo producto puede aparecer en varios cultivos */
async function upsertFertilizante(f: FilaFertilizante): Promise<string> {
  const existente = await db
    .select({ id: fertilizantes.id })
    .from(fertilizantes)
    .where(eq(fertilizantes.nombre, f.nombre))
    .limit(1);

  if (existente.length > 0) return existente[0].id;

  const [nuevo] = await db.insert(fertilizantes).values(f).returning({ id: fertilizantes.id });
  return nuevo.id;
}

// ---------------------------------------------------------------------------
// 4. Cruce: headers del calendario comercial -> qué fertilizante cubre qué elemento
// ---------------------------------------------------------------------------

const ELEMENTO_POR_CAMPO: Record<string, string> = {
  n: "N",
  p2o5: "P2O5",
  k2o: "K2O",
  mgo: "MgO",
  cao: "Ca",
  b: "B",
};

/** "Urea (Lbs)" -> "Urea" ; ignora columnas Admin_/identificadoras */
function extraerNombreProductoDeHeader(header: string): string | null {
  if (header.startsWith("Admin_")) return null;
  if (/^(semana|ddt|fecha)$/i.test(header.trim())) return null;
  const match = header.match(/^(.+?)\s*\((?:Lbs|Kg|Gramos|Lts|Litros|Onzas)\)$/i);
  return match ? match[1].trim() : null;
}

function encontrarMejorMatchCatalogo(nombreProducto: string, catalogo: FilaFertilizante[]): FilaFertilizante | null {
  const objetivo = nombreProducto.toLowerCase().trim();
  // 1. Exacto
  let match = catalogo.find((f) => f.nombre.toLowerCase().trim() === objetivo);
  if (match) return match;

  // 2. Substring
  match = catalogo.find(
    (f) => objetivo.includes(f.nombre.toLowerCase().trim()) || f.nombre.toLowerCase().trim().includes(objetivo)
  );
  return match ?? null;
}

/** De la fila de % del fertilizante, decide qué elemento representa (el de mayor %) */
function elementoPrincipal(f: FilaFertilizante): string | null {
  const valores: [string, number][] = [
    ["n", f.n],
    ["p2o5", f.p2o5],
    ["k2o", f.k2o],
    ["mgo", f.mgo],
    ["cao", f.cao],
    ["b", f.b],
  ];
  const [campo, valor] = valores.reduce((max, actual) => (actual[1] > max[1] ? actual : max));
  return valor > 0 ? ELEMENTO_POR_CAMPO[campo] : null;
}

async function encontrarCalendarioComercial(stem: string, archivosDisponibles: string[]): Promise<string | null> {
  const candidato = archivosDisponibles.find(
    (f) =>
      f.startsWith(stem + "_") &&
      !/_Req\._Diario\.csv$/i.test(f) &&
      !/_Fertilizantes\.csv$/i.test(f) &&
      /Sem|Dias|Diario|Mensual|Año/i.test(f)
  );
  return candidato ?? null;
}

// ---------------------------------------------------------------------------
// 5. upsertCultivo — idempotente, transaccional
// ---------------------------------------------------------------------------

async function upsertCultivoCompleto(
  nombre: string,
  fuenteArchivo: string,
  requerimientos: FilaRequerimiento[],
  fuentesFertilizante: { elemento: string; fertilizanteId: string }[],
) {
  if (requerimientos.length === 0) {
    console.warn(`  ⚠️  ${nombre}: 0 filas de requerimiento — revisar CSV manualmente`);
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(cultivos).where(eq(cultivos.fuenteArchivo, fuenteArchivo));

    const [cultivo] = await tx
      .insert(cultivos)
      .values({ nombre, fuenteArchivo, esPerenne: 0, tipoRiego: "goteo" })
      .returning();

    await tx.insert(requerimientoElemental).values(
      requerimientos.map((r) => ({ ...r, cultivoId: cultivo.id }))
    );

    if (fuentesFertilizante.length > 0) {
      await tx.insert(fuenteFertilizanteCultivo).values(
        fuentesFertilizante.map((f) => ({ ...f, cultivoId: cultivo.id }))
      );
    }
  });

  console.log(
    `  ✅ ${nombre}: ${requerimientos.length} filas de requerimiento, ${fuentesFertilizante.length} fuentes de fertilizante`
  );
}

// ---------------------------------------------------------------------------
// 6. Orquestador
// ---------------------------------------------------------------------------

async function ingestarEstructurado() {
  const archivos = await fs.readdir(CSV_DIR);
  const archivosReqDiario = archivos.filter((f) => /_Req\._Diario\.csv$/i.test(f));

  console.log(`Encontrados ${archivosReqDiario.length} archivos Req._Diario.csv\n`);

  for (const archivoReq of archivosReqDiario) {
    const nombre = extraerNombreCultivo(archivoReq);
    const stem = extraerStemArchivo(archivoReq, /_Req\._Diario\.csv$/i);

    const contenidoReq = await fs.readFile(path.join(CSV_DIR, archivoReq), "utf-8");
    const requerimientos = parsearReqDiario(contenidoReq);

    // Catálogo específico de este archivo (si existe)
    const archivoFert = `${stem}_Fertilizantes.csv`;
    let catalogoDeEsteArchivo: FilaFertilizante[] = [];
    if (archivos.includes(archivoFert)) {
      const contenidoFert = await fs.readFile(path.join(CSV_DIR, archivoFert), "utf-8");
      catalogoDeEsteArchivo = parsearFertilizantes(contenidoFert);
      for (const f of catalogoDeEsteArchivo) await upsertFertilizante(f); // catálogo global, dedupe por nombre
    } else {
      console.warn(`  ⚠️  ${nombre}: no existe ${archivoFert} — fuente_fertilizante_cultivo quedará vacía para este cultivo`);
    }

    // Cruce con el calendario comercial para saber qué producto cubre qué elemento
    const fuentesFertilizante: { elemento: string; fertilizanteId: string }[] = [];
    if (catalogoDeEsteArchivo.length > 0) {
      const archivoCalendario = await encontrarCalendarioComercial(stem, archivos);
      if (archivoCalendario) {
        const contenidoCal = await fs.readFile(path.join(CSV_DIR, archivoCalendario), "utf-8");
        const [headerLine] = contenidoCal.split("\n");
        const headers = parse(headerLine, { columns: false, trim: true })[0] as string[];

        const elementosYaAsignados = new Set<string>();
        for (const header of headers) {
          const nombreProducto = extraerNombreProductoDeHeader(header);
          if (!nombreProducto) continue;
          const match = encontrarMejorMatchCatalogo(nombreProducto, catalogoDeEsteArchivo);
          if (!match) {
            console.warn(`  ⚠️  ${nombre}: columna "${header}" no calzó con ningún producto del catálogo`);
            continue;
          }
          const elemento = elementoPrincipal(match);
          if (!elemento || elementosYaAsignados.has(elemento)) continue;
          const fertilizanteId = await upsertFertilizante(match);
          fuentesFertilizante.push({ elemento, fertilizanteId });
          elementosYaAsignados.add(elemento);
        }
      } else {
        console.warn(`  ⚠️  ${nombre}: no se encontró calendario comercial para cruzar con el catálogo`);
      }
    }

    await upsertCultivoCompleto(nombre, archivoReq, requerimientos, fuentesFertilizante);
  }

  console.log("\n✨ Ingesta estructurada finalizada con éxito.");
  process.exit(0);
}

(async () => {
  try {
    await ingestarEstructurado();
  } catch (e) {
    console.error("Error en ingesta estructurada:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
})();
