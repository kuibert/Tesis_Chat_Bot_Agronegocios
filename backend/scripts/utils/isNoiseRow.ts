const NOISE_KEYWORDS = [
  "propietario",
  "finca",
  "productor",
  "responsable",
  "fecha de visita",
  "visitado por",
  "tecnico responsable",
  "técnico responsable",
  "coordenadas",
  "telefono",
  "teléfono",
  "direccion",
  "dirección",
  "observaciones generales",
  "fecha",
  "agricultor"
];

export function isNoiseRow(rowValues: string[]): boolean {
  const joined = rowValues.join(" ").toLowerCase();
  return NOISE_KEYWORDS.some((kw) => joined.includes(kw));
}
