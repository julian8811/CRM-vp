# CRM-VP - Sistema CRM Innovador

Sistema de gestión de relaciones con clientes (CRM) construido con React 19, Vite y Tailwind CSS v4. Interfaz moderna estilo HubSpot optimizada para ventas con gestión completa del ciclo comercial.

## 🚀 Características

### Páginas Principales
- **Dashboard** - Métricas, gráficos de tendencia, embudo de ventas, top vendedores, acciones rápidas
- **Pipeline Kanban** - Drag & drop con @dnd-kit para gestionar oportunidades entre etapas
- **Clientes** - DataTable con búsqueda, orden, exportación Excel
- **Leads** - Gestión de prospectos con scoring y conversión
- **Productos** - Catálogo con stock, precios y descuentos
- **Cotizaciones** - Estado, envío, aceptación
- **Pedidos** - Seguimiento y estado de pago
- **Automatizaciones** - Workflows activos/pausados
- **Reportes** - Analytics, ventas por vendedor, embudo de conversión
- **IA Comercial** - Asistente AI y features de inteligencia
- **Postventa** - Tickets de soporte
- **Configuración** - Perfil, notificaciones, integraciones
- **Usuarios** - Gestión de equipo

### Features
- 🎨 **Theme Toggle** - Modo oscuro/claro
- ⌘ **Command Palette** - Navegación rápida con Ctrl+K
- 📊 **Export to Excel** - En todas las tablas de datos
- 🔐 **Supabase Auth** - Login/registro real
- 🗄️ **Supabase DB** - Base de datos PostgreSQL
- 🧪 **Testing** - Suite de tests con Vitest

## 🛠️ Tech Stack

| Tecnología | Propósito |
|------------|-----------|
| React 19 | Frontend framework |
| Vite | Build tool |
| Tailwind CSS v4 | Estilos |
| Zustand | State management |
| @dnd-kit | Drag & drop |
| Supabase | Auth + DB |
| Recharts | Gráficos |
| Lucide | Iconos |
| xlsx | Export Excel |
| Vitest | Testing |

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Testing
npm run test:run

# Build producción
npm run build
```

## 🔧 Configuración Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar `supabase-schema.sql` en el SQL Editor
3. Crear `.env.local`:
```env
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_key
```

## 📁 Estructura

```
src/
├── components/
│   ├── ui/          # Button, Card, Input, Badge, etc.
│   └── layout/       # Layout, Sidebar, Header
├── contexts/         # AuthContext, ThemeContext
├── pages/            # Dashboard, Pipeline, Customers, etc.
├── store/            # Zustand store
├── lib/              # API, supabase, utils
├── data/             # Mock data
└── test/             # Tests
```

## 🧪 Tests

```bash
# Run tests
npm run test:run

# UI interactivo
npm run test:ui
```

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm i -g vercel
vercel
```

O importar el repo en https://vercel.com

## 📄 Licencia

MIT
