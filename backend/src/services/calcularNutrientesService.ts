// backend/src/services/calcularNutrientesService.ts
//
// Motor de cálculo determinístico. El LLM lo invoca como tool — nunca calcula
// aritmética él mismo. Si hay ambigüedad (ej. "Piña" con 3 programas distintos),
// devuelve las opciones en vez de adivinar.

import { db } from "../database/db";
import { cultivos } from "../database/schema/Cultivo";
import { requerimientoElemental } from "../database/schema/RequerimientoElemental";
import { fuenteFertilizanteCultivo } from "../database/schema/FuenteFertilizanteCultivo";
import { fertilizantes } from "../database/schema/Fertilizante";
import { and, eq, ilike, or } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ParametrosCalculo = {
  cultivo: string;
  areaHectareas: number;
  diaDespuesSiembra: number;
  diasDelPeriodo?: number;
  tipoRiegoSolicitado?: string;
  fuenteArchivo?: string; // se pasa cuando el usuario ya desambiguó una opción previa
};

type OpcionCultivo = {
  cultivoId: string;
  nombre: string;
  fuenteArchivo: string | null;
  tipoRiego: string;
  cicloDias: number | null;
};

type ResultadoAmbiguo = {
  estado: "ambiguo";
  cultivoConsultado: string;
  opciones: OpcionCultivo[];
  mensaje: string;
};

type ResultadoNoEncontrado = {
  estado: "no_encontrado";
  cultivoConsultado: string;
  mensaje: string;
};

type ResultadoCalculado = {
  estado: "calculado";
  cultivo: string;
  fuenteArchivo: string | null;
  advertencias: string[];
  productos: { nombre: string; cantidad: number; unidad: string }[];
};

export type ResultadoCalculoNutrientes = ResultadoAmbiguo | ResultadoNoEncontrado | ResultadoCalculado;

// ---------------------------------------------------------------------------
// Motor
// ---------------------------------------------------------------------------

export async function calcularNutrientes(p: ParametrosCalculo): Promise<ResultadoCalculoNutrientes> {
  // Match exacto O "empieza con {cultivo} " (con espacio) — evita falsos positivos
  // tipo "Papa" matcheando "Papaya" con un substring libre en ambos extremos.
  const matchNombre = or(
    ilike(cultivos.nombre, p.cultivo),
    ilike(cultivos.nombre, `${p.cultivo} %`),
  );

  const condiciones = p.fuenteArchivo
    ? and(matchNombre, eq(cultivos.fuenteArchivo, p.fuenteArchivo))
    : matchNombre;

  const candidatos = await db.select().from(cultivos).where(condiciones);

  if (candidatos.length === 0) {
    return {
      estado: "no_encontrado",
      cultivoConsultado: p.cultivo,
      mensaje: `No tengo datos ingeridos para "${p.cultivo}". Verifica el nombre del cultivo.`,
    };
  }

  if (candidatos.length > 1) {
    // Ambigüedad real — nunca se adivina cuál quiso decir el usuario
    return {
      estado: "ambiguo",
      cultivoConsultado: p.cultivo,
      opciones: candidatos.map((c) => ({
        cultivoId: c.id,
        nombre: c.nombre,
        fuenteArchivo: c.fuenteArchivo,
        tipoRiego: c.tipoRiego,
        cicloDias: c.cicloDias,
      })),
      mensaje: `Encontré ${candidatos.length} programas de fertilización distintos para "${p.cultivo}". Especifica cuál usando su archivo de origen.`,
    };
  }

  const cultivo = candidatos[0];
  const advertencias: string[] = [];

  if (p.tipoRiegoSolicitado && p.tipoRiegoSolicitado.toLowerCase() !== cultivo.tipoRiego.toLowerCase()) {
    advertencias.push(
      `Los datos disponibles para ${cultivo.nombre} son para riego por ${cultivo.tipoRiego}. ` +
      `No tengo un cálculo validado para riego por ${p.tipoRiegoSolicitado}.`
    );
  }

  // 2. Requerimiento elemental del día pedido (lbs/ha/día)
  const [req] = await db
    .select()
    .from(requerimientoElemental)
    .where(
      and(
        eq(requerimientoElemental.cultivoId, cultivo.id),
        eq(requerimientoElemental.diaDespuesSiembra, p.diaDespuesSiembra),
      )
    )
    .limit(1);

  if (!req) {
    return {
      estado: "no_encontrado",
      cultivoConsultado: p.cultivo,
      mensaje: `No tengo requerimiento definido para el día ${p.diaDespuesSiembra} de ${cultivo.nombre} (ciclo: ${cultivo.cicloDias ?? "desconocido"} días).`,
    };
  }

  // 3. Escalar a libras totales del periodo, para el área real del usuario
  const dias = p.diasDelPeriodo && p.diasDelPeriodo > 0 ? p.diasDelPeriodo : 7;
  const totalElemental: Record<string, number> = {
    N: req.n * p.areaHectareas * dias,
    P2O5: req.p2o5 * p.areaHectareas * dias,
    K2O: req.k2o * p.areaHectareas * dias,
    MgO: (req.mgo ?? 0) * p.areaHectareas * dias,
    Ca: (req.ca ?? 0) * p.areaHectareas * dias,
    // B viene en gramos/ha en la fuente — se mantiene en gramos, no se mezcla con las libras de arriba
  };

  // 4. Convertir cada elemento a producto comercial vía el catálogo
  const fuentes = await db
    .select({
      elemento: fuenteFertilizanteCultivo.elemento,
      fertilizante: fertilizantes,
    })
    .from(fuenteFertilizanteCultivo)
    .innerJoin(fertilizantes, eq(fuenteFertilizanteCultivo.fertilizanteId, fertilizantes.id))
    .where(eq(fuenteFertilizanteCultivo.cultivoId, cultivo.id));

  const CAMPO_POR_ELEMENTO: Record<string, keyof typeof fertilizantes.$inferSelect> = {
    N: "n", P2O5: "p2o5", K2O: "k2o", MgO: "mgo", Ca: "cao", B: "b",
  };

  const productos = fuentes
    .map(({ elemento, fertilizante }) => {
      const cantidadElemento = totalElemental[elemento];
      if (cantidadElemento === undefined) return null; // ej. "B" no está en totalElemental (gramos, no lbs)

      const campo = CAMPO_POR_ELEMENTO[elemento];
      const porcentaje = (fertilizante[campo] as number) ?? 0;
      if (porcentaje <= 0) return null;

      return {
        nombre: fertilizante.nombre,
        cantidad: Math.round((cantidadElemento / (porcentaje / 100)) * 100) / 100,
        unidad: fertilizante.unidad,
      };
    })
    .filter((p): p is { nombre: string; cantidad: number; unidad: string } => p !== null);

  advertencias.push(
    "Esta recomendación no incluye ajuste por tipo de suelo (aún no está modelado — ver limitación de diseño documentada)."
  );

  return {
    estado: "calculado",
    cultivo: cultivo.nombre,
    fuenteArchivo: cultivo.fuenteArchivo,
    advertencias,
    productos,
  };
}
