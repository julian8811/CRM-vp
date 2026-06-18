# Checklist de producción — CRM-VP

**Producción:** https://crm-vp.vercel.app/  
**Repositorio:** https://github.com/julian8811/CRM-vp  
**Supabase:** `tgosnmvlvzaykiuolrot`

## Estado del checklist (actualizado 2026-06-18)

| # | Tarea | Estado | Notas |
|---|--------|--------|-------|
| 1 | Variables `VITE_SUPABASE_*` en Vercel | ✅ Hecho | Login en producción OK |
| 2 | Schema base + migraciones | ✅ Hecho | 10 migraciones en `tgosnmvlvzaykiuolrot` (incl. fix RLS) |
| 3 | Edge Functions desplegadas | ✅ Hecho | 6 functions desplegadas |
| 4 | Secretos Supabase | ⚠️ Parcial | `OPENAI_API_KEY` configurada pero **cuota agotada** · `CRON_SECRET` OK · faltan `META_*` y `RESEND_*` |
| 5 | Frontend en Vercel | ✅ Hecho | Bundle con Google OAuth |
| 6 | Cron `run-automations` | ✅ Hecho | `pg_cron` job `crm-vp-run-automations` cada 15 min |
| 7 | Webhook Meta | ⚠️ Manual | Requiere secretos Meta + callback en Developers |
| 8 | Google OAuth | ✅ Hecho | Provider habilitado; redirect a Google verificado |
| 9 | Usuario admin | ✅ Hecho | `Julián Esteban Pineda Montoya` → `admin` |
| 10 | Emails (Resend) | Opcional | `RESEND_API_KEY` no configurado aún |
| 11 | Verificación E2E | ✅ Hecho | Ver [PRODUCTION_VERIFICATION.md](./PRODUCTION_VERIFICATION.md) |

> **Fix crítico (2026-06-18):** se corrigió recursión RLS en `profiles` y se restauraron políticas faltantes en `opportunities`, `orders`, `quotations` y `activity_log`.

## Credenciales que el agente / operador necesita

Para ejecutar `npm run setup:production` de forma autónoma:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | [Account Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (solo servidor) |
| `CRON_SECRET` | Generar: `openssl rand -hex 24` |
| `OPENAI_API_KEY` | OpenAI platform |
| `RESEND_API_KEY` | Resend.com (emails, opcional) |
| `META_*` | Meta Developers (opcional) |

**Vercel** ya tiene `VITE_SUPABASE_*` si el login en producción funciona.

**Supabase MCP**: autenticá el servidor Supabase en Cursor IDE para que el agente pueda ejecutar SQL y advisors sin CLI.

## 1. Vercel (frontend)

Variables en **Vercel → Project → Settings → Environment Variables**:

```env
VITE_SUPABASE_URL=https://tgosnmvlvzaykiuolrot.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

Redeploy tras cambios. El `vercel.json` ya incluye rewrites SPA.

## 2. Base de datos

### Proyecto existente (producción actual)

```bash
supabase login
supabase link --project-ref tgosnmvlvzaykiuolrot
supabase db push
```

### Proyecto nuevo

1. SQL Editor → ejecutar `supabase-schema.sql`
2. `supabase db push` (migraciones incrementales)
3. Si Storage falla, ejecutar `supabase/optional_storage_avatars.sql`

### Bootstrap automatizado

```bash
npm run bootstrap:supabase
```

## 3. Edge Functions

```bash
npm run deploy:functions
```

| Función | JWT | Uso |
|---------|-----|-----|
| `crm-ai` | Sí | Chat IA |
| `invite-user` | Sí | Invitar usuarios (admin) |
| `meta-sync-leads` | Sí | Sincronizar Lead Ads |
| `meta-send-whatsapp` | Sí | Enviar WhatsApp |
| `meta-webhook` | No | Webhook Meta |
| `run-automations` | No | Cron + emails |

### Secretos (Dashboard → Edge Functions → Secrets)

| Secreto | Requerido |
|---------|-----------|
| `OPENAI_API_KEY` | IA |
| `SUPABASE_SERVICE_ROLE_KEY` | invite-user, run-automations |
| `CRON_SECRET` | run-automations |
| `META_VERIFY_TOKEN` | Webhook |
| `META_APP_SECRET` | Firma webhook |
| `META_PAGE_ACCESS_TOKEN` | Lead Ads |
| `META_WHATSAPP_TOKEN` | WhatsApp |
| `RESEND_API_KEY` | Emails (opcional) |
| `NOTIFICATION_FROM_EMAIL` | Remitente Resend (opcional) |

## 4. Cron de automatizaciones

**Activo en Supabase** (`pg_cron`, cada 15 min, job `crm-vp-run-automations`).

Recrear o verificar:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
bash scripts/setup-cron.sh
```

Backup opcional: workflow `.github/workflows/cron-automations.yml` (requiere `CRON_SECRET` en GitHub Secrets).

## 5. Google OAuth

**Configurado en Supabase** (provider Google habilitado).

Para recrear o actualizar credenciales:

```bash
export GOOGLE_CLIENT_ID=....apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=GOCSPX-...
npx supabase config push --yes
```

O vía Management API:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export GOOGLE_CLIENT_ID=....apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=GOCSPX-...
bash scripts/setup-google-oauth.sh
```

Redirect URI obligatorio en Google:

```text
https://tgosnmvlvzaykiuolrot.supabase.co/auth/v1/callback
```

## 6. Primer administrador

Tras registrarte:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<tu-user-uuid>';
```

## 7. Meta (Lead Ads + WhatsApp)

1. Menú **Meta** en la app → copiar URL del webhook
2. Meta Developers → Webhooks → callback + `META_VERIFY_TOKEN`
3. Registrar formularios Lead Ads en la app
4. Configurar secretos `META_*` en Supabase

## 8. Verificación en producción

Informe completo: [PRODUCTION_VERIFICATION.md](./PRODUCTION_VERIFICATION.md)

| Prueba | Estado |
|--------|--------|
| Login email/password | ✅ |
| Login Google | ✅ (redirect verificado) |
| CRUD cliente / lead / producto | ✅ |
| Pipeline drag & drop (API) | ✅ |
| Notificación al crear lead | ✅ (in-app) |
| Chat IA | ❌ OpenAI quota exceeded |
| Invitar usuario (admin) | ⏸️ No probado en UI |
| Emails vía Resend | ⏸️ Sin `RESEND_API_KEY` |
| Meta / WhatsApp | ⏸️ Sin secretos |

### Verificación rápida (CI local)

```bash
npm ci
npm run lint
npm run test:run
npm run build
```

## Cambios incluidos en este checklist (código)

- Botón Google OAuth en login
- Listado de equipo vía RPC `get_team_profiles`
- Edición de nombre/apellido en Configuración
- Trigger SQL de notificación por nuevo lead
- `run-automations` con envío de email vía Resend (opcional)
- Scripts `bootstrap-supabase` / `deploy-edge-functions`
- `supabase/config.toml` con URL de producción
- Eliminación de páginas legacy en `src/pages/`
- CI con `npm run lint`
