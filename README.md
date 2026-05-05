# CRM VP

Aplicación CRM (Vite + React + Supabase).

## Variables de entorno (cliente)

Crear `.env` o configurar en Vercel:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima (pública) |

Sin estas variables, la app usa datos mock locales para desarrollo.

Proyecto Supabase actual:

```bash
VITE_SUPABASE_URL=https://tgosnmvlvzaykiuolrot.supabase.co
```

## Supabase Edge Functions (servidor)

Desplegar funciones con `supabase functions deploy` y definir secretos **solo en el dashboard** (no en el frontend):

| Secreto | Uso |
|---------|-----|
| `OPENAI_API_KEY` | Función `crm-ai` (OpenAI) |
| `CRON_SECRET` | Función `run-automations` (opcional, invocación programada) |
| `SUPABASE_SERVICE_ROLE_KEY` | Funciones `invite-user` / `run-automations` si aplica |
| `META_VERIFY_TOKEN` | Verificación del webhook de Meta |
| `META_APP_SECRET` | Validación de firma `x-hub-signature-256` |
| `META_PAGE_ACCESS_TOKEN` | Lectura de Lead Ads / Page webhooks |
| `META_WHATSAPP_TOKEN` | Envío de mensajes WhatsApp Cloud API |
| `META_GRAPH_VERSION` | Versión Graph API opcional (`v23.0` por defecto) |

## Migraciones

Aplicar SQL en Supabase SQL Editor o con CLI:

```bash
supabase db push
```

Incluye tablas `support_tickets`, `automation_rules`, `user_preferences`, `notifications`, función `search_crm`, políticas RLS y Realtime para `notifications`.

## Edge Functions (despliegue)

Desde la carpeta del proyecto, con [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase functions deploy crm-ai
supabase functions deploy invite-user
supabase functions deploy run-automations --no-verify-jwt
supabase functions deploy meta-webhook --no-verify-jwt
supabase functions deploy meta-sync-leads
supabase functions deploy meta-send-whatsapp
```

(`run-automations` valida el header `x-cron-secret`; las otras dos requieren JWT de usuario.)

`meta-webhook` valida `hub.verify_token` con `META_VERIFY_TOKEN` y, si existe `META_APP_SECRET`, valida la firma `x-hub-signature-256`. Usá como callback:

```bash
https://tgosnmvlvzaykiuolrot.supabase.co/functions/v1/meta-webhook
```

Secretos en Dashboard → Edge Functions → Secrets: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (invite-user y run-automations), `CRON_SECRET` (run-automations). Invocación programada de `run-automations`:

```bash
curl -X POST "https://tgosnmvlvzaykiuolrot.supabase.co/functions/v1/run-automations" -H "x-cron-secret: $CRON_SECRET"
```

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — producción
- `npm run test:run` — tests Vitest
- CI: `.github/workflows/ci.yml` (build + test)
