/**
 * chunk.parser.ts
 * Responsabilidad única: Limpiar, sanitizar y aplicar matemáticas a los fragmentos (chunks)
 * del RAG antes de ser inyectados en el System Prompt.
 */

/**
 * Reemplaza las etiquetas __EMPTY (con o sin sufijo numérico) por nombres de nutrientes
 * y unidades basados en el orden estándar de las columnas en los calendarios de fertilización.
 * Esto es una red de seguridad; la solución definitiva está en la ingesta.
 */
const nutrientMap: Record<string, string> = {
    '__EMPTY': 'Nombre',
    '__EMPTY_1': 'Formula',
    '__EMPTY_2': 'Dosis',
    '__EMPTY_3': 'N',
    '__EMPTY_4': 'P',
    '__EMPTY_5': 'K',
    '__EMPTY_6': 'Ca',
    '__EMPTY_7': 'Mg',
    '__EMPTY_8': 'S',
    '__EMPTY_9': 'B',
    '__EMPTY_10': 'Unidad',
    '__EMPTY_11': 'Nota',
    '__EMPTY_12': 'Extra1',
    '__EMPTY_13': 'Extra2',
    '__EMPTY_14': 'Extra3'
  };

export function cleanChunkContent(chunk: string, manzanasUsuario: number = 1): string {
  let clean = chunk;
  for (const [key, label] of Object.entries(nutrientMap)) {
    clean = clean.replace(new RegExp(`${key}(_\\d+)?:`, 'g'), `${label}:`);
  }
  // Limpiar espacios horizontales múltiples sin destruir los saltos de línea del JSON
  clean = clean.replace(/[ \t]+/g, ' ').trim();
  
  // SANITIZACIÓN CRÍTICA: Qwen 2.5 7B confunde los requerimientos N,P,K teóricos 
  // con nombres de fertilizantes. Borramos estas llaves para forzarlo a usar los físicos.
  clean = clean.replace(/"(n|p|k|ca|mg|s|b)"\s*:\s*[0-9.]+,?\s*/gi, '');
  
  // APLANAMIENTO Y CÁLCULO MATEMÁTICO REAL
  clean = clean.replace(/```json([\s\S]*?)```/gi, (match, jsonString) => {
    try {
      const obj = JSON.parse(jsonString);
      let text = "--- INICIO DATOS SEMANA ---\n";
      if (obj.semana) text += `Semana o Etapa: ${obj.semana}\n`;
      if (obj.insumos_dosis_por_manzana) {
        text += `FERTILIZANTES FÍSICOS OBLIGATORIOS Y CANTIDADES TOTALES PARA ${manzanasUsuario} MANZANAS:\n`;
        for (const [key, value] of Object.entries(obj.insumos_dosis_por_manzana)) {
          if (["n","p","k","ca","mg","s","b"].includes(key.toLowerCase())) continue;
          
          let nombreLimpio = key.replace(/_lbs|_lts|_gramos|_kg/gi, '').replace(/_/g, ' ').toUpperCase();
          let unidad = "Lbs";
          if (key.includes("gramos")) unidad = "Gramos";
          if (key.includes("lts") || key.includes("litros")) unidad = "Lts";
          if (key.includes("kg")) unidad = "Kg";
          
          if (nombreLimpio === "UREA") nombreLimpio = "Urea";
          if (nombreLimpio.includes("MAP")) nombreLimpio = "MAP 12-61-0";
          if (nombreLimpio.includes("KCL")) nombreLimpio = "KCl Soluble";
          if (nombreLimpio === "SULFATO MAGNESIO") nombreLimpio = "Sulfato de Magnesio";
          if (nombreLimpio === "NITRATO CALCIO") nombreLimpio = "Nitrato de Calcio";
          if (nombreLimpio === "SOLUBOR") nombreLimpio = "Solubor";
          if (nombreLimpio === "MELAZA") nombreLimpio = "Melaza";
          
          // --- MAGIA: TypeScript hace la multiplicación exacta compensando el factor de 1 Hectárea (1.43 Mz) del Excel original ---
          const dosisBase = Number(value);
          const dosisTotalCalculada = ((dosisBase / 1.43) * manzanasUsuario).toFixed(2);
          
          text += `- ${nombreLimpio}: ${dosisTotalCalculada} ${unidad}\n`;
        }
      } else {
        // Fallback si no está anidado
        text += `FERTILIZANTES FÍSICOS OBLIGATORIOS Y CANTIDADES TOTALES PARA ${manzanasUsuario} MANZANAS:\n`;
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value !== "number" || ["semana","ddt","n","p","k","ca","mg","s","b"].includes(key.toLowerCase())) continue;
          
          const dosisBase = Number(value);
          const dosisTotalCalculada = ((dosisBase / 1.43) * manzanasUsuario).toFixed(2);
          text += `- ${key}: ${dosisTotalCalculada}\n`;
        }
      }
      text += "--- FIN DATOS SEMANA ---\n";
      return text;
    } catch (e) {
      return match;
    }
  });

  return clean;
}
