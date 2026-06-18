# CRM VP

Aplicación CRM (Vite + React + Supabase).

**Producción:** https://crm-vp.vercel.app/  
**Checklist completo:** [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

## Variables de entorno (cliente)

Crear `.env` o configurar en Vercel:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima (pública) |

Sin estas variables, la app muestra pantalla de configuración requerida.

Proyecto Supabase actual:

```bash
VITE_SUPABASE_URL=https://tgosnmvlvzaykiuolrot.supabase.co
```

## Bootstrap rápido (Supabase)

```bash
npm run bootstrap:supabase   # db push + deploy functions
npm run deploy:functions     # solo Edge Functions
```

## Supabase Edge Functions (servidor)

Desplegar funciones con `supabase functions deploy` o `npm run deploy:functions`. Secretos **solo en el dashboard**:

| Secreto | Uso |
|---------|-----|
| `OPENAI_API_KEY` | Función `crm-ai` (OpenAI) |
| `CRON_SECRET` | Función `run-automations` |
| `SUPABASE_SERVICE_ROLE_KEY` | `invite-user` / `run-automations` |
| `RESEND_API_KEY` | Emails desde `run-automations` (opcional) |
| `NOTIFICATION_FROM_EMAIL` | Remitente Resend (opcional) |
| `META_VERIFY_TOKEN` | Verificación del webhook de Meta |
| `META_APP_SECRET` | Validación de firma `x-hub-signature-256` |
| `META_PAGE_ACCESS_TOKEN` | Lectura de Lead Ads |
| `META_WHATSAPP_TOKEN` | Envío WhatsApp Cloud API |
| `META_GRAPH_VERSION` | Versión Graph API opcional (`v23.0` por defecto) |

## Migraciones

```bash
supabase link --project-ref tgosnmvlvzaykiuolrot
supabase db push
```

**Proyecto nuevo:** ejecutar primero `supabase-schema.sql` en SQL Editor, luego `db push`.

Incluye extensiones CRM, `search_crm`, `get_team_profiles`, trigger de notificaciones por lead, Meta, RLS y Realtime.

## Edge Functions (despliegue)

```bash
supabase functions deploy crm-ai
supabase functions deploy invite-user
supabase functions deploy run-automations --no-verify-jwt
supabase functions deploy meta-webhook --no-verify-jwt
supabase functions deploy meta-sync-leads
supabase functions deploy meta-send-whatsapp
```

`meta-webhook` callback:

```bash
https://tgosnmvlvzaykiuolrot.supabase.co/functions/v1/meta-webhook
```

Cron de automatizaciones:

```bash
curl -X POST "https://tgosnmvlvzaykiuolrot.supabase.co/functions/v1/run-automations" -H "x-cron-secret: $CRON_SECRET"
```

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — producción
- `npm run lint` — ESLint
- `npm run test:run` — tests Vitest
- `npm run bootstrap:supabase` — migraciones + functions
- CI: `.github/workflows/ci.yml` (lint + build + test)
