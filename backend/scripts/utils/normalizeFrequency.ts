export class UnrecognizedFrequencyError extends Error {
  constructor(raw: string) {
    super(`Frecuencia no reconocida: "${raw}" — requiere revisión manual`);
    this.name = "UnrecognizedFrequencyError";
  }
}

const FREQUENCY_MAP: Record<string, string> = {
  "1 vez por semana": "1_por_sem",
  "1 vez por sem": "1_por_sem",
  "una vez por semana": "1_por_sem",
  "semanal": "1_por_sem",
  "14 dias": "14_dias",
  "14 días": "14_dias",
  "quincenal": "14_dias",
  "cada 15 dias": "14_dias",
  "cada 15 días": "14_dias",
  "mensual": "1_por_mes",
  "1 vez por mes": "1_por_mes",
  "diario": "diario",
  "todos los dias": "diario",
  "todos los días": "diario",
};

export function normalizeFrequency(raw: string): string {
  const clean = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .trim();

  if (FREQUENCY_MAP[clean]) return FREQUENCY_MAP[clean];

  // fallback: intento de match parcial
  if (clean.includes("semana") || clean.includes("sem") || clean.includes("1 por sem")) return "1_por_sem";
  if (clean.includes("quince") || clean.includes("14")) return "14_dias";
  if (clean.includes("mes")) return "1_por_mes";
  if (clean.includes("diari") || clean.includes("cal-diario") || clean.includes("diario")) return "diario";
  if (clean.includes("2")) return "2_por_sem";
  if (clean.includes("3")) return "3_por_sem";
  
  // si nada matchea, NO inventar un código
  throw new UnrecognizedFrequencyError(raw);
}
