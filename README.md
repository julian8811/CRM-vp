# CRM VP

CRM comercial B2B — React + Supabase, desplegado en **https://crm-vp.vercel.app/**

Repositorio: https://github.com/julian8811/CRM-vp

## Inicio rápido

```bash
cp .env.example .env          # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm ci && npm run dev
```

## Estructura del proyecto

```
├── src/
│   ├── app/           # Router principal
│   ├── features/      # Pantallas del CRM (dashboard, leads, meta…)
│   ├── components/    # UI compartida
│   ├── lib/           # API y utilidades
│   └── store/         # Estado Zustand
├── supabase/
│   ├── migrations/    # Schema versionado
│   └── functions/     # Edge Functions
├── docs/              # Checklist producción, arquitectura
└── scripts/           # Bootstrap y deploy
```

Documentación: [docs/README.md](docs/README.md) · Producción: [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build producción |
| `npm run lint` | ESLint |
| `npm run test:run` | Tests (Vitest) |
| `npm run bootstrap:supabase` | Migraciones + functions |
| `npm run deploy:functions` | Solo Edge Functions |

## Producción (resumen)

1. Variables en **Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
2. `export SUPABASE_ACCESS_TOKEN=sbp_...` → `bash scripts/production-setup.sh`
3. Secretos en Supabase Dashboard (ver checklist)
4. Primer usuario → `role = 'admin'` en `profiles`

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md)
