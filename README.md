# 🚜 AgroChat: Asistente Agrícola Basado en IA

¡Bienvenido al repositorio de AgroChat! Este proyecto es un sistema de asistencia inteligente (Chatbot) diseñado para proveer recomendaciones técnicas de fertilización de cultivos en Honduras, basado en calendarios históricos del proyecto MCA-EDA.

AgroChat utiliza una arquitectura **RAG (Retrieval-Augmented Generation)** respaldada por una Base de Datos Vectorial (PostgreSQL + pgvector), embeddings generados localmente con DistilBERT, y un LLM local servido por **Ollama**.

---

## 🏗️ Arquitectura del Sistema

El proyecto está dividido en cuatro componentes principales:

1. **`/data`**: Contiene los archivos originales en Excel (`.xls`/`.xlsx`) con los calendarios históricos de fertilización del proyecto MCA-EDA Honduras, además de los CSVs pre-procesados y un manifiesto JSON con metadatos de cada cultivo.
2. **`/database`**: Script SQL de inicialización para habilitar la extensión `vector` (pgvector) en PostgreSQL.
3. **`/backend`**: Servidor API REST + WebSockets construido con Node.js, Express y TypeScript. Contiene el pipeline RAG completo del bot: detección de cultivos, query rewriting, búsqueda híbrida vectorial, generación de prompts anti-alucinación, e integración con Ollama.
4. **`/frontend`**: Interfaz de chat moderna e interactiva construida como PWA con React, Vite y Tailwind CSS. Renderiza mensajería rica (tablas, Markdown, bloques de código con syntax highlighting).

### Stack Tecnológico
* **Frontend:** React 18, Vite, Zustand (Manejo de estados), Tailwind CSS, React-Markdown, rehype-highlight.
* **Backend:** Node.js, TypeScript, Express.js, Socket.IO (WebSockets).
* **Base de Datos:** PostgreSQL 16+ con extensión `pgvector`.
* **ORM:** Drizzle ORM.
* **Inteligencia Artificial (Embeddings):** HuggingFace `@xenova/transformers` (modelo local `Xenova/distiluse-base-multilingual-cased-v2`) ejecutado en un **Worker Thread** dedicado para no bloquear el Event Loop de Node.js.
* **Inteligencia Artificial (LLM):** **Ollama** ejecutando modelos locales (por defecto `qwen2.5:7b`). Configurado vía Docker Compose con soporte para GPU NVIDIA.
* **Procesamiento de Datos:** Scripts TypeScript y Python para ETL de Excels a CSV, chunking semántico y vectorización masiva.
* **Autenticación:** Google OAuth, Microsoft OAuth (MSAL) y login local.

---

## 🚀 Flujo del Pipeline RAG

A diferencia de un LLM comercial al que se le inyecta un Excel en cada mensaje, AgroChat pre-procesa todo el conocimiento y usa una Búsqueda Híbrida (Vector + Keyword).

### Pipeline ETL (Offline)
1. **Conversión:** `/backend/scripts/convert-xls-to-xlsx.ts` convierte archivos `.xls` legacy a `.xlsx`.
2. **Extracción a CSV:** `/backend/scripts/convertir_excels_a_csv.py` extrae cada hoja de cada Excel a un archivo CSV independiente (por frecuencia de aplicación: `1 Por Sem`, `2 Por Sem`, `14 Dias`, `Cal-Diario`, etc.).
3. **Ingesta y Vectorización:** `/backend/scripts/ingest-data.ts` lee los CSVs, crea chunks estructurados (con JSON de dosificación por semana), genera embeddings de 768 dimensiones con DistilBERT en un Worker Thread, y los almacena en PostgreSQL con pgvector.
4. **Orquestación:** `/backend/scripts/full-ingest.ts` ejecuta los 4 pasos anteriores en secuencia automáticamente.

### Pipeline de Consulta (Runtime)
1. **Detección de cultivo:** El backend extrae el nombre del cultivo de la consulta del usuario usando un algoritmo fuzzy (Levenshtein + coincidencia de frase) comparando contra los nombres de archivos en la BD.
2. **Query Rewriting:** El `context.manager.ts` reformula la pregunta del usuario usando el historial de conversación y el LLM de Ollama para crear una "Standalone Query" optimizada para búsqueda vectorial.
3. **Búsqueda Híbrida:** Se genera un embedding de la consulta y se busca en PostgreSQL usando una combinación ponderada de:
   - **90% Similitud Coseno** (pgvector `<=>`)
   - **10% Full Text Search** (PostgreSQL `ts_rank_cd`)
4. **Generación de Respuesta:** Los fragmentos recuperados se inyectan en un System Prompt con 11 reglas anti-alucinación (Chain of Thought, evidencia obligatoria, muro de seguridad para temas no agrícolas). Ollama genera la respuesta en modo streaming.
5. **Anti-alucinación de fuentes:** Una ventana deslizante intercepta y reemplaza las fuentes que el LLM podría inventar por las fuentes reales provenientes de pgvector.

---

## 🛠️ Configuración Inicial (Para Desarrolladores)

### 1. Prerrequisitos
- Node.js 18+
- PostgreSQL 14+ con extensión `pgvector`
- Python 3.8+ (para el script de conversión de Excels)
- Docker (para Ollama con GPU) o Ollama instalado localmente
- Git

### 2. Base de Datos
```bash
# Crear la base de datos e instalar pgvector
psql -U postgres -c "CREATE DATABASE fertilization_db;"
psql -U postgres -d fertilization_db -f database/schema.sql
```

### 3. Variables de Entorno
Crea un archivo `.env` en la carpeta `backend`:
```env
PORT=3000
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/fertilization_db?schema=public"
OLLAMA_MODEL="qwen2.5:7b"
COOKIE_NAME="agrochat_session"
```
Crea un archivo `.env` en la carpeta `frontend`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_MICROSOFT_CLIENT_ID=tu_microsoft_client_id
```

### 4. Ollama (LLM Local)
```bash
# Opción A: Docker Compose (con GPU NVIDIA)
docker compose up -d

# Opción B: Ollama instalado localmente
ollama pull qwen2.5:7b
ollama serve
```

### 5. Backend
```bash
cd backend
npm install

# Generar el cliente de Drizzle
npx drizzle-kit push

# ¡Paso CRÍTICO! Alimentar el cerebro del bot (Pipeline completo):
npx tsx scripts/full-ingest.ts

# Levantar servidor
npm run dev
```

### 6. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🐛 Notas para el Desarrollador

* **Drizzle ORM + Raw SQL:** En `document.repository.ts` utilizamos consultas con `sql` template tags de Drizzle porque se necesitan los operadores de distancia de `pgvector` (`<=>`) y `ts_rank_cd` de PostgreSQL Full Text Search, que no tienen soporte nativo en ORMs.
* **Worker Thread:** El servicio de embeddings (`embeddingService.ts`) delega la inferencia de DistilBERT a un hilo de trabajo separado (`embedding.worker.ts`) para no bloquear el Event Loop de Node.js durante las consultas.
* **Bypass de censura:** El `context.manager.ts` reemplaza temporalmente nombres de químicos agrícolas comunes (ej. "Nitrato de Amonio") por aliases neutros antes de enviarlos al Query Rewriter, para evitar que modelos como Llama 3 activen filtros de seguridad innecesarios.
* **Sesiones:** El sistema soporta tres modos: usuario autenticado (historial persistente), usuario no autenticado (sesión temporal sin memoria), y modo offline (PWA).

¡Feliz Código! Construido en conjunto para revolucionar el acceso a datos agrícolas en Honduras. 🚜🇭🇳
