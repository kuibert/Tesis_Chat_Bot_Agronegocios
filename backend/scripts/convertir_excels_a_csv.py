"""
Script definitivo: Convierte archivos Excel del MAG a CSV limpios.
Usa openpyxl para leer correctamente celdas combinadas.
Procesa TODAS las hojas de calendario (las que tienen "Semana", "DDT", etc.).
"""

import openpyxl
import pandas as pd
from pathlib import Path
import re

# ---- CONFIGURACIÓN ----
SCRIPT_DIR = Path(__file__).resolve().parent
INPUT_DIR = SCRIPT_DIR.parent.parent / "data" / "Calendarios de Fertilizacion-20260214T220614Z-1-001" / "Calendarios de Fertilizacion"
OUTPUT_DIR = SCRIPT_DIR.parent.parent / "data" / "csv"
HOJAS_IGNORADAS = ["main", "portada", "carátula", "índice"]
ADMIN_KEYWORDS = ["precio", "costo", "total", "inversión"]

def es_hoja_ignorada(nombre_hoja):
    nombre_lower = nombre_hoja.lower()
    return any(p in nombre_lower for p in HOJAS_IGNORADAS)

def evaluar_referencia(val, ws_current_form, wb_form, wb_val):
    """
    Evalúa una referencia de celda de otra hoja (ej. =Main!$D$42 o =Fertilizantes!$A$3)
    o una fórmula VLOOKUP (ej. =VLOOKUP(D42,Fertilizante2,11,FALSE)).
    Devuelve el valor string resolviendo celdas combinadas.
    """
    if not isinstance(val, str) or not val.startswith("="):
        return val
        
    val_clean = val.replace(" ", "")
    
    # 1. Si es un VLOOKUP
    if "VLOOKUP(" in val_clean:
        try:
            pattern = r"=VLOOKUP\(([^,]+),\s*([^,]+),\s*(\d+),\s*(FALSE|TRUE)\)"
            match = re.match(pattern, val_clean)
            if match:
                lookup_cell_ref = match.group(1).replace("$", "")
                col_idx = int(match.group(3))
                
                # Obtener el valor de la celda de búsqueda en la hoja actual
                search_cell_form = ws_current_form[lookup_cell_ref]
                search_val = search_cell_form.value
                
                # Si el valor de búsqueda es a su vez una fórmula, resolverlo recursivamente
                if isinstance(search_val, str) and search_val.startswith("="):
                    search_val = evaluar_referencia(search_val, ws_current_form, wb_form, wb_val)
                else:
                    # Si no es fórmula, buscar su valor evaluado
                    ws_current_val = wb_val[ws_current_form.title]
                    search_val = ws_current_val[lookup_cell_ref].value
                    for merged_range in ws_current_val.merged_cells.ranges:
                        if ws_current_val[lookup_cell_ref].coordinate in merged_range:
                            search_val = ws_current_val.cell(row=merged_range.min_row, column=merged_range.min_col).value
                            break
                    
                if search_val:
                    # Buscar en la hoja de Fertilizantes de wb_val
                    sheet_fert_val = None
                    for sname in wb_val.sheetnames:
                        if sname.lower().startswith("fertiliz"):
                            sheet_fert_val = wb_val[sname]
                            break
                    if sheet_fert_val:
                        for r in range(1, sheet_fert_val.max_row + 1):
                            cell_a_val = sheet_fert_val.cell(row=r, column=1).value
                            if cell_a_val and str(cell_a_val).strip().lower() == str(search_val).strip().lower():
                                return sheet_fert_val.cell(row=r, column=col_idx).value
        except Exception as e:
            pass
        return val
        
    # 2. Si es una referencia simple a otra hoja (ej. =Main!$D$42)
    try:
        clean = val[1:] # Quitar el "="
        sheet_name = None
        cell_address = clean
        
        if "!" in clean:
            parts = clean.split("!")
            sheet_name = parts[0].replace("'", "").strip()
            cell_address = parts[1].replace("$", "").strip()
            
        if sheet_name and sheet_name in wb_form.sheetnames:
            ref_sheet_form = wb_form[sheet_name]
            ref_sheet_val = wb_val[sheet_name]
            cell_ref_form = ref_sheet_form[cell_address]
            cell_ref_val = ref_sheet_val[cell_address]
            
            # Buscar el valor de la fórmula en la hoja de referencia
            ref_val = cell_ref_form.value
            for merged_range in ref_sheet_form.merged_cells.ranges:
                if cell_ref_form.coordinate in merged_range:
                    ref_val = ref_sheet_form.cell(row=merged_range.min_row, column=merged_range.min_col).value
                    break
            
            if isinstance(ref_val, str) and ref_val.startswith("="):
                # Para la celda referenciada, ws_current es ref_sheet_form
                return evaluar_referencia(ref_val, ref_sheet_form, wb_form, wb_val)
            else:
                # Devolver el valor evaluado real de esa celda en wb_val
                val_real = cell_ref_val.value
                for merged_range in ref_sheet_val.merged_cells.ranges:
                    if cell_ref_val.coordinate in merged_range:
                        val_real = ref_sheet_val.cell(row=merged_range.min_row, column=merged_range.min_col).value
                        break
                return val_real
    except Exception as e:
        pass
    return val

def obtener_valor_celda_combinada(ws_form, ws_val, cell_form, wb_form, wb_val):
    """Si la celda está en un rango combinado, devuelve el valor principal. Resuelve fórmulas de referencia cruzada."""
    val = cell_form.value
    for merged_range in ws_form.merged_cells.ranges:
        if cell_form.coordinate in merged_range:
            val = ws_form.cell(row=merged_range.min_row, column=merged_range.min_col).value
            break
            
    if val and isinstance(val, str) and val.startswith("="):
        val = evaluar_referencia(val, ws_form, wb_form, wb_val)
    else:
        # Si no es fórmula, tomar el valor crudo real
        val = ws_val.cell(row=cell_form.row, column=cell_form.column).value
        for merged_range in ws_val.merged_cells.ranges:
            if cell_form.coordinate in merged_range:
                val = ws_val.cell(row=merged_range.min_row, column=merged_range.min_col).value
                break
    return val

def extraer_cabeceras_calendario(ws_form, ws_val, wb_form, wb_val):
    """Busca la fila con 'Semana' en la col 1, extrae cabeceras base y de unidades, y devuelve lista compuesta + fila de inicio de datos."""
    # 1. Buscar fila de cabecera base (contiene "Semana" en la primera columna)
    fila_base = None
    for r in range(1, 21):
        cell_form = ws_form.cell(row=r, column=1)
        val = obtener_valor_celda_combinada(ws_form, ws_val, cell_form, wb_form, wb_val)
        if val and "semana" in str(val).lower():
            fila_base = r
            break
            
    if not fila_base:
        return None, None  # No se encontró cabecera

    # 2. Obtener valores de la fila base y la siguiente (posibles unidades)
    cabeceras_base = []
    cabeceras_unidades = []
    for col in range(1, ws_form.max_column + 1):
        cell_base = ws_form.cell(row=fila_base, column=col)
        val_base = obtener_valor_celda_combinada(ws_form, ws_val, cell_base, wb_form, wb_val)
        cabeceras_base.append(str(val_base).strip() if val_base is not None else None)

        cell_ud = ws_form.cell(row=fila_base + 1, column=col)
        val_ud = obtener_valor_celda_combinada(ws_form, ws_val, cell_ud, wb_form, wb_val)
        cabeceras_unidades.append(str(val_ud).strip() if val_ud is not None else None)

    # 3. Verificar si la fila siguiente es realmente de unidades
    es_fila_unidades = any("lbs" in str(v).lower() or "kg" in str(v).lower() or "cambios" in str(v).lower()
                           for v in cabeceras_unidades if v)

    # 4. Construir cabeceras compuestas
    cabeceras_compuestas = []
    for idx, (base, ud) in enumerate(zip(cabeceras_base, cabeceras_unidades)):
        if base and ud and es_fila_unidades:
            if "cambios" in ud.lower():
                cabeceras_compuestas.append(f"{base} (Cambios)")
            else:
                cabeceras_compuestas.append(f"{base} ({ud})")
        elif base:
            cabeceras_compuestas.append(base)
        elif ud and es_fila_unidades:
            cabeceras_compuestas.append(ud)
        else:
            cabeceras_compuestas.append(f"Columna_{idx}")

    # 5. Determinar fila donde empiezan los datos
    fila_datos = fila_base + (2 if es_fila_unidades else 1)

    return cabeceras_compuestas, fila_datos

def hacer_cabeceras_unicas(cabeceras):
    """Garantiza que no haya nombres de columnas duplicados añadiendo sufijos."""
    conteos = {}
    unicas = []
    for col in cabeceras:
        if col in conteos:
            conteos[col] += 1
            unicas.append(f"{col}_{conteos[col]}")
        else:
            conteos[col] = 0
            unicas.append(col)
    return unicas

def procesar_archivo(archivo_path):
    print(f"\n📄 Procesando: {archivo_path.name}")
    wb_form = openpyxl.load_workbook(archivo_path, data_only=False)
    wb_val = openpyxl.load_workbook(archivo_path, data_only=True)

    for nombre_hoja in wb_form.sheetnames:
        if es_hoja_ignorada(nombre_hoja):
            continue
        ws_form = wb_form[nombre_hoja]
        ws_val = wb_val[nombre_hoja]

        cabeceras, fila_datos = extraer_cabeceras_calendario(ws_form, ws_val, wb_form, wb_val)
        if cabeceras is None:
            print(f"   ⚠️  Hoja '{nombre_hoja}' no tiene cabecera de calendario, se omite.")
            continue

        cabeceras = hacer_cabeceras_unicas(cabeceras)

        # Leer datos con pandas a partir de la fila correcta
        df = pd.read_excel(archivo_path, sheet_name=nombre_hoja, header=None, skiprows=fila_datos - 1)
        df.columns = cabeceras[:len(df.columns)]  # Ajustar por si acaso

        # Marcar columnas administrativas
        nuevas_cols = []
        for col in df.columns:
            col_lower = str(col).lower()
            if any(kw in col_lower for kw in ADMIN_KEYWORDS):
                nuevas_cols.append(f"Admin_{col}")
            else:
                nuevas_cols.append(col)
        df.columns = nuevas_cols

        # Encontrar la columna de semana
        col_semana = [col for col in df.columns if 'semana' in str(col).lower()]
        if col_semana:
            col_name = col_semana[0]
            # Si es un DataFrame por duplicados, obtener la primera columna Series
            series_semana = df[col_name]
            if isinstance(series_semana, pd.DataFrame):
                series_semana = series_semana.iloc[:, 0]
                
            df[col_name] = pd.to_numeric(series_semana, errors='coerce')
            df = df.dropna(subset=[col_name])
            
            # Volver a filtrar de manera segura
            series_filtrado = df[col_name]
            if isinstance(series_filtrado, pd.DataFrame):
                series_filtrado = series_filtrado.iloc[:, 0]
            df = df[series_filtrado > 0]
            
            # Castear a entero de manera segura
            series_final = df[col_name]
            if isinstance(series_final, pd.DataFrame):
                series_final = series_final.iloc[:, 0]
            df[col_name] = series_final.astype(int)

        if df.empty:
            print(f"   ⚠️  Hoja '{nombre_hoja}' sin datos válidos, se omite.")
            continue

        # Guardar CSV
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        nombre_csv = f"{archivo_path.stem}_{nombre_hoja.replace(' ', '_')}.csv"
        ruta_salida = OUTPUT_DIR / nombre_csv
        df.to_csv(ruta_salida, index=False, encoding='utf-8')
        print(f"   ✅ {nombre_csv} ({len(df)} filas)")

    # Cerrar workbooks y eliminar el archivo temporal xlsx si vino de un .xls
    wb_form.close()
    wb_val.close()
    original_xls = archivo_path.with_suffix(".xls")
    if original_xls.exists():
        try:
            archivo_path.unlink()
        except Exception:
            pass

def main():
    print("🚀 Iniciando proceso de conversión...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Buscar los archivos .xlsx listos para procesar
    archivos = list(INPUT_DIR.glob("*.xlsx"))
    if not archivos:
        print(f"❌ No se encontraron archivos Excel en '{INPUT_DIR}'")
        return

    for archivo in archivos:
        procesar_archivo(archivo)

    print(f"\n✨ Conversión completada. Los CSV están en '{OUTPUT_DIR}'")

if __name__ == "__main__":
    main()
