# CRM-VP — scripts operativos

| Script | Uso |
|--------|-----|
| `bootstrap-supabase.sh` | `db push` + deploy functions (requiere CLI logueado) |
| `production-setup.sh` | Setup completo con `SUPABASE_ACCESS_TOKEN` |
| `deploy-edge-functions.sh` | Solo Edge Functions |
| `split-app-modules.mjs` | Herramienta dev: partir `App.jsx` en features |

```bash
chmod +x scripts/*.sh
export SUPABASE_ACCESS_TOKEN=sbp_...
bash scripts/production-setup.sh
```

Variables: ver `.env.production.example`
