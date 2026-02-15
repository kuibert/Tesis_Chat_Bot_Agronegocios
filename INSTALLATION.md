# 🚀 Guía de Instalación - AgroChat

Esta guía te ayudará a configurar el proyecto AgroChat en tu computadora desde cero.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** versión 18 o superior → [Descargar aquí](https://nodejs.org/)
- **PostgreSQL** versión 14 o superior → [Descargar aquí](https://www.postgresql.org/download/)
- **Git** → [Descargar aquí](https://git-scm.com/)
- Un editor de código (recomendado: [VS Code](https://code.visualstudio.com/))

### Verificar instalaciones

Abre tu terminal y ejecuta:

```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
psql --version    # Debe mostrar PostgreSQL 14.x o superior
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

### 2.2 Ejecutar el esquema SQL

Desde la raíz del proyecto, ejecuta:

```bash
psql -U postgres -d fertilization_db -f database/schema.sql
```

Si te pide contraseña, ingresa la contraseña de tu usuario `postgres`.

### 2.3 Verificar que la tabla se creó

```bash
psql -U postgres -d fertilization_db -c "\dt"
```

Deberías ver la tabla `fertilization_plans`.

---

## ⚙️ Paso 3: Configurar el Backend

### 3.1 Navega a la carpeta backend

```bash
cd backend
```

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Configurar variables de entorno

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

# Entorno
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Reemplaza `TU_CONTRASEÑA` con tu contraseña real de PostgreSQL.

### 3.4 Generar Prisma Client

```bash
npx prisma generate
```

### 3.5 Cargar datos de fertilización (Opcional)

Si tienes los archivos Excel en la carpeta `data/`:

```bash
npx ts-node scripts/processXlsData.ts
```

Esto cargará los 61 calendarios de fertilización a la base de datos.

### 3.6 Iniciar el servidor backend

```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor de AgroChat corriendo en http://localhost:3000
```

**✅ ¡Backend listo!** Deja esta terminal abierta.

---

## 🎨 Paso 4: Configurar el Frontend

### 4.1 Abre una NUEVA terminal y navega al frontend

```bash
cd frontend
```

### 4.2 Instalar dependencias

```bash
npm install
```

### 4.3 Iniciar el servidor frontend

```bash
npm run dev
```

Deberías ver:
```
VITE v4.5.14  ready in XXXms

➜  Local:   http://localhost:8081/
```

**✅ ¡Frontend listo!**

---

## 🧪 Paso 5: Probar la Aplicación

1. Abre tu navegador en **http://localhost:8081**
2. Deberías ver la interfaz del chatbot con el título "Asistente de Fertilización 🇭🇳"
3. Prueba hacer una pregunta, por ejemplo: *"¿Qué aplicar para tomate?"*
4. Si funciona correctamente, recibirás una respuesta con datos históricos.

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

### Error: "Module not found: @prisma/client"

**Causa:** Prisma Client no se generó correctamente.

**Solución:**
```bash
cd backend
npx prisma generate
```

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
├── backend/              # API y lógica del servidor
│   ├── src/             # Código fuente
│   ├── prisma/          # Configuración de Prisma ORM
│   ├── scripts/         # Scripts de carga de datos
│   └── .env            # ⚠️ Variables de entorno (NO versionar)
├── frontend/            # Interfaz de usuario
│   └── src/            # Componentes React
├── database/            # Scripts SQL
├── data/               # Archivos Excel (calendarios)
└── README.md           # Documentación general
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
