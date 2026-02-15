# AgroChat - Asistente de Fertilización Agrícola 🌱🇭🇳

Sistema de chatbot inteligente para optimizar programas de fertilización agrícola basado en datos históricos de Honduras.

## 🎓 Proyecto de Tesis

**Título:** Diseño y Desarrollo de un Asistente Chatbot para Optimización de Programas de Fertilización en Cultivos Agrícolas, Basado en Datos Históricos

**Autor:** [Tu Nombre]  
**Universidad:** [Tu Universidad]  
**Año:** 2026

## 🚀 Tecnologías

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - API REST
- **Prisma ORM** - Gestión de base de datos
- **PostgreSQL** - Base de datos principal
- Preparado para **pgvector** (búsqueda semántica futura)

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool moderno
- **Tailwind CSS** - Diseño responsivo
- **Zustand** - Gestión de estado

## 📊 Características

✅ Consulta de recomendaciones de fertilización por cultivo y zona  
✅ Base de datos con 60+ calendarios agrícolas de Honduras  
✅ Interfaz amigable para técnicos y agricultores  
✅ Respuestas basadas exclusivamente en datos históricos verificados  
✅ Sistema offline-first con persistencia local  

## 🛠️ Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Uso

1. Inicia el backend: `http://localhost:3000`
2. Inicia el frontend: `http://localhost:8081`
3. Abre el navegador y chatea con el asistente

## 📝 Variables de Entorno

Crea un archivo `.env` en la carpeta `backend`:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/fertilization_db"
PORT=3000
```

## 🗂️ Estructura del Proyecto

```
chatbot-fertilizacion/
├── backend/           # API y lógica de negocio
│   ├── src/
│   ├── prisma/
│   └── scripts/
├── frontend/          # Interfaz de usuario
│   └── src/
├── database/          # Scripts SQL
└── data/             # Datos de fertilización (no versionados)
```

## 🔒 Seguridad

- No incluye datos sensibles en el repositorio
- Variables de entorno para configuración
- Validación de entradas del usuario

## 📄 Licencia

Este proyecto es parte de una tesis académica. Uso educativo permitido con atribución.

---

**Desarrollado con ❤️ para mejorar la agricultura en Honduras**
