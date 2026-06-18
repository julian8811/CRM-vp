# Arquitectura — CRM-VP

## Vista general

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Vercel (SPA)   │────▶│  Supabase Auth   │     │  Edge Functions     │
│  React + Vite   │     │  + Postgres RLS  │◀───▶│  crm-ai, meta-*,    │
│  crm-vp.vercel  │     │  + Realtime      │     │  run-automations    │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

## Frontend (`src/`)

```
src/
├── app/              # Shell: routing, layout, carga de datos
├── config/           # Constantes (PAGE_TITLES, STAGE_COLORS)
├── features/         # Un módulo por pantalla del CRM
│   ├── auth/
│   ├── dashboard/
│   ├── customers/
│   ├── leads/
│   ├── pipeline/
│   └── …
├── components/       # UI reutilizable (ui/, layout/)
├── contexts/         # Auth, Theme, Notifications, Modals
├── lib/              # API, auth, métricas, Supabase client
├── store/            # Zustand (useStore)
└── test/             # Vitest
```

### Flujo de datos

1. `AuthProvider` resuelve sesión Supabase.
2. `App` dispara `fetch*` del store al autenticarse.
3. Cada feature lee/escribe vía `useStore` → `lib/api.js` → Supabase.
4. Funciones serverless (IA, Meta, cron) viven en `supabase/functions/`.

## Backend (`supabase/`)

- **Migraciones** versionadas en `migrations/`
- **RLS** en todas las tablas `public`
- **Triggers**: perfil al registrarse, `updated_at`, notificación por nuevo lead
- **RPC**: `search_crm`, `get_team_profiles`

## Despliegue

| Capa | Dónde |
|------|--------|
| Frontend | Vercel (push a `main`) |
| Base de datos | `supabase db push` |
| Functions | `npm run deploy:functions` |
| Secretos | Supabase Dashboard |

Ver [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).
