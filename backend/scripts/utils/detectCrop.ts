// backend/scripts/utils/detectCrop.ts
//
// Extraído de ingest-pdfs.ts (sin cambios) — se reutiliza en el script nuevo.
// Nota: esta lista debería idealmente cruzarse contra la tabla `cultivos` real
// (60 nombres ya cargados en la Fase 1) en vez de una lista fija de keywords.
// Lo dejo como está por ahora para no cambiar dos cosas a la vez; si quieres,
// en otra ronda lo actualizamos para que consulte la tabla real.

const CROP_KEYWORDS: Record<string, string> = {
  maiz: "maiz", maíz: "maiz", yuca: "yuca", agave: "agave", tomate: "tomate",
  aguacate: "aguacate", cafe: "cafe", café: "cafe", papa: "papa", cebolla: "cebolla",
  chile: "chile", frijol: "frijol", arroz: "arroz", sorgo: "sorgo",
  platano: "platano", plátano: "platano", banano: "banano", sandia: "sandia",
  sandía: "sandia", melon: "melon", melón: "melon", pina: "pina", piña: "pina",
  citricos: "citricos", cítricos: "citricos", limon: "limon", limón: "limon",
  naranja: "naranja",
};

export function detectCropFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  for (const [kw, crop] of Object.entries(CROP_KEYWORDS)) {
    if (lower.includes(kw)) return crop;
  }
  return "general";
}
