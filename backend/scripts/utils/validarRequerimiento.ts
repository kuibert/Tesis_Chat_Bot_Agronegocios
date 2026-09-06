export type Advertencia = { tipo: string; detalle: string };

export function validarRequerimiento(filas: Record<string, any>[]): Advertencia[] {
  const advertencias: Advertencia[] = [];

  if (filas.length === 0) {
    advertencias.push({ tipo: "INFO_SIN_DATOS", detalle: "No se extrajo ninguna fila nutricional (hoja vacía o de preventivos)" });
    return advertencias;
  }

  // Rangos plausibles (Umbrales de sanidad muy altos para detectar ruido absurdo)
  // ej. un fertilizante no debería pasar de 5000 lbs por manzana en una sola aplicación semanal/diaria.
  const MAX_DOSIS_LBS = 5000;
  const MAX_DOSIS_GRAMOS = 30000; // 30 kilos
  
  const FERTILIZANTES_COMUNES = ["n", "p", "k", "ca", "mg", "s", "b", "urea_lbs", "map_lbs", "kcl_lbs"];

  for (const fila of filas) {
    const semana = fila["semana"];
    const ddt = fila["ddt"];
    
    // Verificar que los fertilizantes estén dentro de rango
    for (const campo of Object.keys(fila.insumos_dosis_por_manzana || {})) {
      const valor = fila.insumos_dosis_por_manzana[campo];
      
      const isGramos = campo.includes("gramos");
      const umbral = isGramos ? MAX_DOSIS_GRAMOS : MAX_DOSIS_LBS;

      if (typeof valor === "number" && valor > umbral) {
        advertencias.push({
          tipo: "CRITICO_FUERA_DE_RANGO",
          detalle: `${campo}=${valor} en Semana ${semana}/DDT ${ddt} — excede el máximo razonable (${umbral}). Posible sumatoria o error de parseo.`,
        });
      }
    }
  }

  // Verificar que semana y ddt sean crecientes
  const semanasNum = filas.map(f => Number(f["semana"])).filter(n => !isNaN(n));
  const desordenadoSemana = semanasNum.some((d, i) => i > 0 && d < semanasNum[i - 1]);
  if (desordenadoSemana) {
    advertencias.push({ tipo: "INFO_ORDEN_INCONSISTENTE", detalle: "Las semanas no vienen en orden cronológico creciente (revisar agrupaciones en el Excel)" });
  }

  return advertencias;
}
