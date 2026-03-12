# 🚜 AgroChat: Asistente Agrícola Basado en IA

¡Bienvenido al repositorio de AgroChat! Este proyecto es un sistema de asistencia inteligente (Chatbot) diseñado para proveer recomendaciones técnicas de fertilización de cultivos en Honduras, basado en calendarios históricos del proyecto MCA-EDA.

AgroChat utiliza una arquitectura **RAG (Retrieval-Augmented Generation)** respaldada por una Base de Datos Vectorial (PostgreSQL + pgvector) y embeddings generados localmente.

---

## 🏗️ Arquitectura del Sistema

El proyecto está dividido en cuatro componentes principales:

1. **`/data`**: Contiene los archivos originales en Excel (`.xls`) con los calendarios históricos de fertilización del proyecto MCA-EDA Honduras.
2. **`/database`**: Scripts SQL de inicialización para crear la tabla base en PostgreSQL y habilitar la extensión `vector` (pgvector).
3. **`/backend`**: Servidor API REST construido con Node.js, Express y TypeScript. Contiene el "Cerebro" lógico del bot, la integración del modelo de IA, y scripts del pipeline ETL (Extracción y Vectorización de datos).
4. **`/frontend`**: Interfaz de chat moderna e interactiva construida con React, Vite y Tailwind CSS. Renderiza mensajería rica (tablas de análisis de suelos y Markdown).

### Stack Tecnológico
* **Frontend:** React 18, Vite, Zustand (Manejo de estados), Tailwind CSS, React-Markdown.
* **Backend:** Node.js, TypeScript, Express.js.
* **Base de Datos:** PostgreSQL 16+ con extensión `pgvector`.
* **ORM:** Prisma.
* **Inteligencia Artificial (NLP):** HuggingFace `@xenova/transformers` (modelo local `Xenova/distiluse-base-multilingual-cased-v2`) para embeddings semánticos.
* **Procesamiento de Datos:** Librería `xlsx` para lectura determinista del corpus tabular.

---

## 🚀 Flujo Mágico (RAG Pipeline)

A diferencia de un LLM comercial al que se le inyecta un Excel en cada mensaje, AgroChat pre-procesa todo el conocimiento y usa Similitud de Cosenos (Cosine Similarity).

1. **Pipeline ETL (Offline):** El script `/backend/scripts/processXlsData.ts` lee la carpeta `/data`, extrae ~1,700 registros granulares (generales, prevención, dosis semanales, análisis de ppm) y los guarda en PostgreSQL. Luego `/backend/scripts/generateEmbeddings.ts` corre el modelo de Transformadores locales para crear vectores matemáticos de cada registro.
2. **Búsqueda (Runtime):** El usuario escribe "dosis semana 5 del tomate".
3. **Filtro Lógico:** El backend extrae el nombre del cultivo de la sesión, formatea la intención de la pregunta (si incluye palabra "semana") e ignora tildes (`normalizeText`).
4. **Vectorización de Pregunta:** La pregunta del usuario se convierte en Vector con Xenova.
5. **Similitud y Respuesta:** Prisma busca en PostgreSQL usando SQL Crudo los 3 registros vectoriales más cercanos (Similitud Coseno), devuelve la fila en bruto, y el Chatbot la estructura para el Frontend de forma amistosa (Tablas / Íconos).

---

## 🛠️ Configuración Inicial (Para Desarrolladores)

### 1. Base de Datos
* Instalar PostgreSQL e instalar la extensión `pgvector`.
* Ejecutar el script `database/schema.sql` (Verifica que se instale `CREATE EXTENSION IF NOT EXISTS vector`).

### 2. Variables de Entorno
Crea un archivo `.env` en la carpeta `backend` con lo siguiente:
```env
PORT=3000
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/fertilization_db?schema=public"
```
Crea un archivo `.env` en la carpeta `frontend`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Backend e IA
```bash
cd backend
npm install
npx prisma generate
npx prisma db push

# ¡Paso CRÍTICO! Alimentar el cerebro del bot (Corre en orden):
npx ts-node scripts/processXlsData.ts # Extrae excels a DB
npx ts-node scripts/generateEmbeddings.ts # Convierte textos a Vectores IA

# Levantar servidor
npm run dev
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🐛 Notas para el Desarrollador Externo
* **Prisma vs rawQuery:** En `backend/src/index.ts` utilizamos consultas RAW (`prisma.$queryRaw`) porque Prisma ORM no soporta de forma nativa los operadores de distancia matemática de `pgvector` (`<=>`). Se debe tener extremo cuidado con el casteo directo (`$n::vector`).
* **Tratamientos Preventivos:** Los insecticidas, fungicidas y otros preventivos se leen directamente de las filas ~75-85 de los Excels (Ver `processXlsData.ts`).
* **Sesiones:** Para evitar que el bot se desvíe, el backend guarda un mapa temporal de memoria con el contexto del cultivo en memoria RAM (No persistente).

¡Feliz Código! Construido en conjunto para revolucionar el acceso a datos agrícolas en Honduras. 🚜🇭🇳
