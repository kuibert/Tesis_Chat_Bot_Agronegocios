import re
import xlrd
from pathlib import Path

ADMIN_KEYWORDS = ["precio", "costo", "total", "inversión"]

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

def extraer_cabeceras_con_xlrd(xls_path: Path, nombre_hoja: str):
    """
    Extrae cabeceras del archivo .xls ORIGINAL usando xlrd.
    xlrd lee correctamente las celdas combinadas y formulas de los archivos .xls del MAG.
    Aplica forward-fill para propagar nombres de fertilizantes en columnas de valores adyacentes.
    Retorna (cabeceras_compuestas, fila_datos_0based) o (None, None) si no encuentra encabezado.
    """
    try:
        wb = xlrd.open_workbook(str(xls_path))
        if nombre_hoja not in wb.sheet_names():
            return None, None
        ws = wb.sheet_by_name(nombre_hoja)
    except Exception as e:
        print(f"      ⚠️  xlrd no pudo leer '{xls_path.name}': {e}")
        return None, None

    # 1. Buscar la fila que contiene 'Semana' en la primera columna (0-based)
    fila_base_0 = None
    for r in range(min(ws.nrows, 25)):
        val = ws.cell_value(r, 0)
        if val:
            val_str = str(val).strip()
            # Debe ser exactamente 'Semana' o similar (etiqueta corta), no un titulo largo
            if "semana" in val_str.lower() and len(val_str) <= 15:
                fila_base_0 = r
                break

    if fila_base_0 is None:
        return None, None

    # 2. Leer fila de nombres y fila de unidades (siguiente fila)
    n_cols = ws.ncols
    nombres_raw = [str(ws.cell_value(fila_base_0, c)).strip() if ws.cell_value(fila_base_0, c) else "" for c in range(n_cols)]
    unidades_raw = [str(ws.cell_value(fila_base_0 + 1, c)).strip() if ws.cell_value(fila_base_0 + 1, c) else "" for c in range(n_cols)]

    # Limpiar artefactos de formulas Excel (ej: ",@ Melaza" -> "Melaza")
    import re as _re
    nombres_raw = [_re.sub(r'^[,@\s\.\#\!\?]+', '', n).strip() for n in nombres_raw]

    # 3. Detectar si la fila de unidades realmente tiene unidades (Lbs, Kg, Gramos, etc.)
    UNIDADES_VALIDAS = {"lbs", "kg", "gramos", "lts", "litros", "g", "onzas"}
    es_fila_unidades = any(
        u.lower() in UNIDADES_VALIDAS or "cambios" in u.lower()
        for u in unidades_raw if u
    )

    # 4. Construir cabeceras con forward-fill inteligente
    cabeceras_compuestas = []
    ultimo_fertilizante = None

    for idx, (nombre, ud) in enumerate(zip(nombres_raw, unidades_raw)):
        nombre_lower = nombre.lower()
        ud_lower = ud.lower()

        # Columnas de administración a ignorar (costos, precios, etc.)
        es_admin = any(kw in nombre_lower for kw in ADMIN_KEYWORDS)

        if nombre and ud and es_fila_unidades:
            if "cambios" in ud_lower:
                # Columna de registro de cambios para este fertilizante → Admin
                cabeceras_compuestas.append(f"Admin_{nombre}_Cambios")
                ultimo_fertilizante = nombre  # guardar por si la siguiente columna de valor lo necesita
            elif es_admin:
                cabeceras_compuestas.append(f"Admin_{nombre}")
            else:
                # Columna principal del fertilizante con su unidad: e.g. "Urea (Lbs)"
                cabeceras_compuestas.append(f"{nombre} ({ud})")
                ultimo_fertilizante = nombre
        elif nombre and not ud:
            # Columna identificadora (Semana, DDT, Fecha) o nombre sin unidad
            cabeceras_compuestas.append(nombre)
        elif not nombre and ud and es_fila_unidades:
            ud_lower_strip = ud_lower.strip()
            if "cambios" in ud_lower_strip:
                # Columna de cambios sin nombre explícito → derivar del último fertilizante conocido
                ref = ultimo_fertilizante or f"col_{idx}"
                cabeceras_compuestas.append(f"Admin_{ref}_Cambios")
            elif ud_lower_strip in UNIDADES_VALIDAS and ultimo_fertilizante:
                # Columna de valor sin nombre → usar último fertilizante (forward-fill)
                cabeceras_compuestas.append(f"{ultimo_fertilizante} ({ud})")
            else:
                cabeceras_compuestas.append(ud if ud else f"Columna_{idx}")
        else:
            cabeceras_compuestas.append(f"Columna_{idx}")

    # 5. Determinar fila 0-based donde comienzan los datos reales
    fila_datos_0based = fila_base_0 + (2 if es_fila_unidades else 1)

    return cabeceras_compuestas, fila_datos_0based


def extraer_cabeceras_calendario(ws_form, ws_val, wb_form, wb_val):
    """Fallback usando openpyxl cuando xlrd no está disponible."""
    fila_base = None
    for r in range(1, 21):
        cell_form = ws_form.cell(row=r, column=1)
        val = obtener_valor_celda_combinada(ws_form, ws_val, cell_form, wb_form, wb_val)
        if val and "semana" in str(val).lower():
            fila_base = r
            break
    if not fila_base:
        return None, None

    cabeceras_base = []
    cabeceras_unidades = []
    for col in range(1, ws_form.max_column + 1):
        cell_base = ws_form.cell(row=fila_base, column=col)
        val_base = obtener_valor_celda_combinada(ws_form, ws_val, cell_base, wb_form, wb_val)
        cabeceras_base.append(str(val_base).strip() if val_base is not None else None)
        cell_ud = ws_form.cell(row=fila_base + 1, column=col)
        val_ud = obtener_valor_celda_combinada(ws_form, ws_val, cell_ud, wb_form, wb_val)
        cabeceras_unidades.append(str(val_ud).strip() if val_ud is not None else None)

    es_fila_unidades = any("lbs" in str(v).lower() or "kg" in str(v).lower() or "cambios" in str(v).lower()
                           for v in cabeceras_unidades if v)
    cabeceras_compuestas = []
    for idx, (base, ud) in enumerate(zip(cabeceras_base, cabeceras_unidades)):
        if base and ud and es_fila_unidades:
            if "cambios" in ud.lower():
                cabeceras_compuestas.append(f"Admin_{base}_Cambios")
            else:
                cabeceras_compuestas.append(f"{base} ({ud})")
        elif base:
            cabeceras_compuestas.append(base)
        elif ud and es_fila_unidades:
            cabeceras_compuestas.append(ud)
        else:
            cabeceras_compuestas.append(f"Columna_{idx}")
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
