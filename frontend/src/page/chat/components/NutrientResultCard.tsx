// frontend/src/page/chat/components/NutrientResultCard.tsx
//
// Renderiza el resultado estructurado de calcularNutrientes() directo desde
// el dato (messages.metadata), no desde el texto que redactó el LLM.

import { AlertTriangle } from "lucide-react";

type ProductoDosis = { nombre: string; cantidad: number; unidad: string };

export type OpcionCultivo = {
  cultivoId: string;
  nombre: string;
  fuenteArchivo: string | null;
  tipoRiego: string;
  cicloDias: number | null;
};

export type ResultadoCalculoNutrientes =
  | { estado: "calculado"; cultivo: string; fuenteArchivo: string | null; advertencias: string[]; productos: ProductoDosis[] }
  | { estado: "ambiguo"; cultivoConsultado: string; opciones: OpcionCultivo[]; mensaje: string }
  | { estado: "no_encontrado"; cultivoConsultado: string; mensaje: string };

export function NutrientResultCard({
  resultado,
  toolArgs,
  onElegirOpcion,
}: {
  resultado: ResultadoCalculoNutrientes;
  toolArgs?: { cultivo?: string; areaHectareas?: number; diaDespuesSiembra?: number; diasDelPeriodo?: number };
  onElegirOpcion?: (opcion: OpcionCultivo, args?: { cultivo?: string; areaHectareas?: number; diaDespuesSiembra?: number; diasDelPeriodo?: number }) => void;
}) {
  if (resultado.estado === "no_encontrado") {
    return (
      <div className="my-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        {resultado.mensaje}
      </div>
    );
  }

  if (resultado.estado === "ambiguo") {
    return (
      <div className="my-2 rounded-xl border border-slate-200 dark:border-[#2D3139] bg-slate-50 dark:bg-[#1C1E22] p-4 shadow-sm">
        <p className="text-sm text-slate-700 dark:text-gray-300 mb-3">{resultado.mensaje}</p>
        <div className="flex flex-col gap-2">
          {resultado.opciones.map((op) => (
            <button
              key={op.cultivoId}
              onClick={() => onElegirOpcion?.(op, toolArgs)}
              className="text-left px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#2D3139] hover:bg-emerald-50 dark:hover:bg-indigo-600/30 border border-slate-200 dark:border-[#2D3139] hover:border-emerald-500 dark:hover:border-indigo-500 transition-colors text-sm text-slate-800 dark:text-gray-200 shadow-xs"
            >
              <span className="font-medium">
                {op.fuenteArchivo
                  ? op.fuenteArchivo
                      .replace(/_Req\._Diario\.csv$/i, "") // quita el sufijo técnico
                      .replace(/_MCA-EDA_Fert_\d{4}-\d+/i, "") // quita el código interno
                      .replace(/_/g, " ") // convierte guiones bajos en espacios
                      .trim()
                  : op.nombre}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // estado === "calculado"
  return (
    <div className="my-2 rounded-xl border border-slate-200 dark:border-[#2D3139] bg-white dark:bg-[#1C1E22] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-[#2D3139] bg-slate-50 dark:bg-[#15171a]">
        <span className="text-xs text-slate-500 dark:text-gray-400">Dosis calculada — </span>
        <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">{resultado.cultivo}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 dark:text-gray-500 border-b border-slate-200 dark:border-[#2D3139]/60">
            <th className="text-left px-4 py-2 font-normal">Producto</th>
            <th className="text-right px-4 py-2 font-normal">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {resultado.productos.map((p) => (
            <tr key={p.nombre} className="border-b border-slate-100 dark:border-[#2D3139]/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-transparent">
              <td className="px-4 py-2 text-slate-700 dark:text-gray-200">{p.nombre}</td>
              <td className="px-4 py-2 text-right text-emerald-700 dark:text-indigo-300 font-mono font-medium">
                {p.cantidad} {p.unidad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {resultado.advertencias.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-500/5 border-t border-amber-200 dark:border-amber-500/20 flex gap-2 items-start">
          <AlertTriangle className="size-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            {resultado.advertencias.map((a, i) => (
              <span key={i} className="text-xs text-amber-800 dark:text-amber-300/90">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
