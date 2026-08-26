import os, json
from pathlib import Path

# Buscamos la carpeta de excels en los dos posibles lugares
possible_dirs = [
    Path("data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion"),
    Path("data/excels"),
    Path("../data/Calendarios de Fertilizacion-20260214T220614Z-1-001/Calendarios de Fertilizacion"),
    Path("../data/excels")
]

EXCELS_DIR = None
for d in possible_dirs:
    if d.exists() and d.is_dir():
        EXCELS_DIR = d
        break

if not EXCELS_DIR:
    print("❌ No se encontró la carpeta de archivos Excel en las rutas esperadas.")
    exit(1)

print(f"📂 Usando carpeta de excels: {EXCELS_DIR}")

# Determinamos la ruta del manifiesto
MANIFIESTO_PATH = Path("data/manifiesto.json")
if not MANIFIESTO_PATH.parent.exists():
    MANIFIESTO_PATH = Path("../data/manifiesto.json")

# Si aún no existe la carpeta contenedora, la creamos
MANIFIESTO_PATH.parent.mkdir(parents=True, exist_ok=True)

archivos = list(EXCELS_DIR.glob("*.xls")) + list(EXCELS_DIR.glob("*.xlsx"))
if not archivos:
    print(f"❌ No se encontraron archivos Excel en {EXCELS_DIR}")
    exit(1)

if MANIFIESTO_PATH.exists():
    with open(MANIFIESTO_PATH, 'r', encoding='utf-8') as f:
        manifiesto = json.load(f)
    existentes = {c['nombre_archivo'] for c in manifiesto['archivos_config']}
else:
    manifiesto = {"archivos_config": []}
    existentes = set()

nuevos = 0
for archivo in archivos:
    nombre = archivo.name
    # Ignorar archivos temporales de Excel creados por Office
    if nombre.startswith("~$"):
        continue
    if nombre not in existentes:
        manifiesto['archivos_config'].append({
            "nombre_archivo": nombre,
            "cultivo": nombre.split("_")[0].lower().replace(" ", "_"),
            "suelo_recomendado": "franco_arcilloso",
            "fertilidad_base": "intermedia",
            "area_base": "1 manzana"
        })
        existentes.add(nombre)
        nuevos += 1

with open(MANIFIESTO_PATH, 'w', encoding='utf-8') as f:
    json.dump(manifiesto, f, indent=2, ensure_ascii=False)

print(f"✅ Manifiesto guardado en {MANIFIESTO_PATH} con {len(manifiesto['archivos_config'])} archivos ({nuevos} nuevos)")
