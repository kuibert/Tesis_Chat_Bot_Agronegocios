# 🚀 Guía de Instalación - AgroChat

Esta guía te ayudará a configurar el proyecto AgroChat en tu computadora desde cero.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** versión 18 o superior → [Descargar aquí](https://nodejs.org/)
- **PostgreSQL** versión 14 o superior → [Descargar aquí](https://www.postgresql.org/download/)
- **Python** versión 3.8 o superior → [Descargar aquí](https://www.python.org/downloads/) (necesario para el script de conversión de Excels)
- **Docker** (recomendado para Ollama con GPU) → [Descargar aquí](https://www.docker.com/)
- **Git** → [Descargar aquí](https://git-scm.com/)
- Un editor de código (recomendado: [VS Code](https://code.visualstudio.com/))

### Verificar instalaciones

Abre tu terminal y ejecuta:

```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
psql --version    # Debe mostrar PostgreSQL 14.x o superior
python --version  # Debe mostrar Python 3.8.x o superior
git --version     # Debe mostrar git version 2.x.x
```

---

## 🔧 Paso 1: Clonar el Repositorio

```bash
# Clona el proyecto
git clone https://github.com/kuibert/Tesis_Chat_Bot_Agronegocios.git

# Navega a la carpeta del proyecto
cd Tesis_Chat_Bot_Agronegocios
```

---

## 🗄️ Paso 2: Configurar la Base de Datos

### 2.1 Crear la base de datos

Abre PostgreSQL (pgAdmin o línea de comandos) y ejecuta:

```sql
CREATE DATABASE fertilization_db;
```

### 2.2 Instalar pgvector y ejecutar el esquema SQL

Desde la raíz del proyecto, ejecuta:

```bash
psql -U postgres -d fertilization_db -f database/schema.sql
```

Si te pide contraseña, ingresa la contraseña de tu usuario `postgres`.

Este script instala la extensión `vector` (pgvector) necesaria para la búsqueda semántica.

---

## 🤖 Paso 3: Configurar Ollama (LLM Local)

AgroChat utiliza **Ollama** para ejecutar modelos de lenguaje de forma local y privada.

### Opción A: Docker Compose (Recomendada, con GPU NVIDIA)

```bash
# Desde la raíz del proyecto
docker compose up -d
```

Esto levanta el servicio de Ollama con soporte para GPU NVIDIA en el puerto `11434`.

### Opción B: Ollama instalado localmente

1. Descarga Ollama desde [ollama.com](https://ollama.com/)
2. Instala y ejecuta:

```bash
# Descargar el modelo por defecto
ollama pull qwen2.5:7b

# Iniciar el servidor (si no se inicia automáticamente)
ollama serve
```

### Verificar que Ollama está corriendo

```bash
curl http://localhost:11434/api/tags
```

Deberías ver una lista de modelos disponibles.

---

## ⚙️ Paso 4: Configurar el Backend

### 4.1 Navega a la carpeta backend

```bash
cd backend
```

### 4.2 Instalar dependencias

```bash
npm install
```

### 4.3 Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend`:

```bash
# Windows
type nul > .env

# Mac/Linux
touch .env
```

Abre el archivo `.env` y agrega:

```env
# URL de conexión a PostgreSQL
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/fertilization_db"

# Puerto del servidor (por defecto 3000)
PORT=3000

# Modelo de Ollama a utilizar
OLLAMA_MODEL="qwen2.5:7b"

# Nombre de la cookie de sesión
COOKIE_NAME="agrochat_session"

# Entorno
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Reemplaza `TU_CONTRASEÑA` con tu contraseña real de PostgreSQL.

### 4.4 Sincronizar esquema con Drizzle ORM

```bash
npx drizzle-kit push
```

### 4.5 Cargar datos de fertilización (¡Paso CRÍTICO!)

Este es el paso que "alimenta el cerebro" del chatbot. El script `full-ingest.ts` automatiza todo el proceso:

1. Convierte archivos `.xls` legacy a `.xlsx`
2. Extrae cada hoja de Excel a archivos CSV con Python
3. Limpia la base de datos (trunca tablas)
4. Lee los CSVs, genera embeddings de 768 dimensiones con DistilBERT, y los almacena en PostgreSQL

```bash
npx tsx scripts/full-ingest.ts
```

**⏱️ Nota:** Este proceso puede tomar varios minutos dependiendo de tu hardware, ya que genera embeddings vectoriales para miles de registros. El modelo de IA (DistilBERT) corre en un Worker Thread separado para no bloquear el servidor.

### 4.6 Iniciar el servidor backend

```bash
npm run dev
```

Deberías ver:
```
Server running in: http://localhost:3000
✅ [EmbeddingService] Worker listo para recibir peticiones.
```

**✅ ¡Backend listo!** Deja esta terminal abierta.

---

## 🎨 Paso 5: Configurar el Frontend

### 5.1 Abre una NUEVA terminal y navega al frontend

```bash
cd frontend
```

### 5.2 Instalar dependencias

```bash
npm install
```

### 5.3 Configurar variables de entorno

Crea un archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_MICROSOFT_CLIENT_ID=tu_microsoft_client_id
```

### 5.4 Iniciar el servidor frontend

```bash
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in XXXms

➜  Local:   http://localhost:5173/
```

**✅ ¡Frontend listo!**

---

## 🧪 Paso 6: Probar la Aplicación

1. Abre tu navegador en **http://localhost:5173**
2. Puedes usar el chat **sin iniciar sesión** (modo sin memoria) o registrarte con Google/Microsoft
3. Prueba hacer una pregunta, por ejemplo: *"¿Qué fertilizantes lleva el tomate?"*
4. Si funciona correctamente, recibirás una respuesta con datos reales de los calendarios MCA-EDA, incluyendo las fuentes consultadas
5. También puedes instalar la app como **PWA** usando el botón "Instalar App" en la barra de navegación

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to database"

**Causa:** La base de datos no está corriendo o las credenciales son incorrectas.

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Revisa que el `DATABASE_URL` en `.env` tenga la contraseña correcta
3. Prueba la conexión:
   ```bash
   psql -U postgres -d fertilization_db
   ```

### Error: "Port 3000 is already in use"

**Causa:** Otro proceso está usando el puerto 3000.

**Solución:**
- Cambia el puerto en `backend/.env`:
  ```env
  PORT=3001
  ```
- O detén el proceso que está usando el puerto 3000

### Error: "Ollama respondió con error" o "El asistente se está reiniciando"

**Causa:** El servicio de Ollama no está corriendo o el modelo no está descargado.

**Solución:**
1. Verifica que Ollama esté corriendo: `curl http://localhost:11434/api/tags`
2. Si usas Docker: `docker compose up -d`
3. Si usas Ollama local: `ollama serve` y luego `ollama pull qwen2.5:7b`

### Error: "Worker falló" o "Timeout: el Worker tardó más de 30s"

**Causa:** El Worker Thread de embeddings tuvo un problema al cargar el modelo DistilBERT.

**Solución:**
1. Verifica que tienes suficiente RAM disponible (al menos 2GB libres)
2. Reinicia el servidor backend (`npm run dev`)
3. El Worker se reinicia automáticamente si falla

### Frontend muestra página en blanco

**Causa:** El backend no está corriendo o hay un error en la consola.

**Solución:**
1. Abre la consola del navegador (F12)
2. Revisa si hay errores de red (debería estar conectado a `http://localhost:3000/api`)
3. Verifica que el backend esté corriendo en otra terminal

---

## 📁 Estructura del Proyecto

```
Tesis_Chat_Bot_Agronegocios/
├── backend/                    # API y lógica del servidor
│   ├── src/
│   │   ├── database/          # Esquema Drizzle ORM + Repositorios
│   │   ├── factory/
│   │   │   ├── ai/            # Pipeline RAG, Ollama handler, prompt builder
│   │   │   └── auth/          # Autenticación (Google, Microsoft, local)
│   │   ├── features/          # Módulos de dominio (auth, chats, messages)
│   │   ├── services/          # Embedding service + Worker Thread
│   │   └── routes/            # Rutas API REST y WebSocket
│   ├── scripts/               # Scripts ETL (ingesta, conversión, truncado)
│   └── .env                   # ⚠️ Variables de entorno (NO versionar)
├── frontend/                   # Interfaz de usuario (PWA)
│   └── src/
│       ├── components/        # NavBar, SideBar, MarkdownMessage, PWA
│       ├── page/              # ChatPage, SignInPage
│       ├── hooks/             # Custom hooks (chat, auth)
│       └── libs/              # Socket.IO client
├── database/                   # Script SQL (pgvector)
├── data/                       # Archivos Excel (calendarios) + CSVs
├── docker-compose.yml          # Ollama con GPU NVIDIA
└── README.md                   # Documentación general
```

---

## 🔐 Seguridad

**NUNCA** subas el archivo `.env` a Git. Ya está incluido en `.gitignore`.

Si accidentalmente expones credenciales:
1. Cambia inmediatamente las contraseñas
2. Regenera tokens/secrets
3. Revisa el historial de Git con `git log`

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas con la instalación:
1. Revisa esta guía paso a paso
2. Consulta los logs de error en la terminal
3. Contacta al equipo del proyecto

---

**¡Listo para desarrollar!** 🎉🌱
