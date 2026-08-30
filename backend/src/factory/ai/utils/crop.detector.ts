/**
 * crop.detector.ts
 * Responsabilidad única: Utilidades para Fuzzy Matching y normalización de nombres de cultivos
 * a partir de la consulta del usuario.
 */

export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitución
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // inserción/eliminación
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Extrae el nombre limpio del cultivo a partir del nombre del archivo Excel.
 */
export function extractCropName(fileName: string): string {
  let name = fileName.replace(/\.[^/.]+$/, "");
  const cutSuffixes = [
    "_MCA-EDA", "_Fert", "_Año", "_Años", "_50-Ton", "_Menos", 
    "_Plantilla", "_Vivero", "_Segundo", "_Mensual", "_Req",
    "_3000-Gavetas", "_4000-Gavetas", "_4000_Gavetas", "_Gavetas"
  ];
  for (const suffix of cutSuffixes) {
    const idx = name.indexOf(suffix);
    if (idx !== -1) {
      name = name.substring(0, idx);
    }
  }
  return name.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Detecta el cultivo en la consulta del usuario de forma robusta e insensible a typos
 * priorizando coincidencia de frase exacta y previniendo colisiones (ej. chive vs chile dulce).
 */
export function detectCrop(query: string, allFileNames: string[]): string | null {
  const normalizedQuery = normalizeText(query);
  const cropMap = new Map<string, string>(); // normalizedCleanCrop -> originalPrefix

  for (const fileName of allFileNames) {
    const clean = extractCropName(fileName);
    const normalizedClean = normalizeText(clean);
    
    // Extraer prefijo original con guiones bajos para el filtro SQL (ej: "chile_dulce")
    let originalPrefix = fileName.replace(/\.[^/.]+$/, "");
    const cutSuffixes = [
      "_MCA-EDA", "_Fert", "_Año", "_Años", "_50-Ton", "_Menos", 
      "_Plantilla", "_Vivero", "_Segundo", "_Mensual", "_Req",
      "_3000-Gavetas", "_4000-Gavetas", "_4000_Gavetas", "_Gavetas"
    ];
    for (const suffix of cutSuffixes) {
      const idx = originalPrefix.indexOf(suffix);
      if (idx !== -1) {
        originalPrefix = originalPrefix.substring(0, idx);
      }
    }

    if (normalizedClean.length > 2) {
      cropMap.set(normalizedClean, originalPrefix.toLowerCase());
    }
  }

  const crops = Array.from(cropMap.keys());

  // 1. Buscar coincidencia de frase exacta (de mayor a menor longitud)
  const sortedCrops = [...crops].sort((a, b) => b.length - a.length);
  for (const crop of sortedCrops) {
    if (normalizedQuery.includes(crop)) {
      return cropMap.get(crop) || null;
    }
  }

  // 2. Buscar si todas las palabras del cultivo están presentes en la consulta
  let bestMatch: string | null = null;
  let maxWords = 0;
  for (const crop of crops) {
    const words = crop.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const allPresent = words.every(word => normalizedQuery.includes(word));
    if (allPresent && words.length > maxWords) {
      bestMatch = crop;
      maxWords = words.length;
    }
  }

  if (bestMatch) {
    return cropMap.get(bestMatch) || null;
  }

  return null;
}
