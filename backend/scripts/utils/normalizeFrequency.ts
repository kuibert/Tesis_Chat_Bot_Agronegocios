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

/** Distancia de edición simple (Levenshtein) para tolerar errores de tipeo */
function distancia(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function normalizeFrequency(raw: string): string {
  const clean = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .trim();

  if (FREQUENCY_MAP[clean]) return FREQUENCY_MAP[clean];

  // Fuzzy match (Distancia Levenshtein)
  let mejor: { nombre: string; dist: number } | null = null;
  for (const [key, value] of Object.entries(FREQUENCY_MAP)) {
    const d = distancia(clean, key);
    if (d <= 2 && (!mejor || d < mejor.dist)) {
      mejor = { nombre: value, dist: d };
    }
  }
  
  if (mejor) {
    console.warn(`[Fuzzy Match] Frecuencia "${raw}" mapeada como "${mejor.nombre}" (distancia: ${mejor.dist})`);
    return mejor.nombre;
  }

  // fallback: intento de match parcial
  if (clean.includes("semana") || clean.includes("sem") || clean.includes("1 por sem")) return "1_por_sem";
  if (clean.includes("quince") || clean.includes("14")) return "14_dias";
  if (clean.includes("mes") || clean.includes("mensual")) return "1_por_mes";
  if (clean.includes("diari") || clean.includes("cal-diario") || clean.includes("diario")) return "diario";
  if (clean.includes("2")) return "2_por_sem";
  if (clean.includes("3")) return "3_por_sem";
  
  // si nada matchea, NO inventar un código
  throw new UnrecognizedFrequencyError(raw);
}
