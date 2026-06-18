# Checklist de producción — CRM-VP

**Producción:** https://crm-vp.vercel.app/  
**Repositorio:** https://github.com/julian8811/CRM-vp  
**Supabase:** `tgosnmvlvzaykiuolrot`

## Estado del checklist

| # | Tarea | Estado | Notas |
|---|--------|--------|-------|
| 1 | Variables `VITE_SUPABASE_*` en Vercel | ✅ Hecho | La app en producción muestra login (Supabase configurado) |
| 2 | Schema base + migraciones | ⚠️ Manual | Proyectos nuevos: `supabase-schema.sql` → `supabase db push` |
| 3 | Edge Functions desplegadas | ⚠️ Manual | `npm run deploy:functions` |
| 4 | Secretos Supabase | ⚠️ Manual | Ver tabla abajo |
| 5 | Frontend en Vercel | ✅ Hecho | https://crm-vp.vercel.app/ |
| 6 | Cron `run-automations` | ⚠️ Manual | Programar cada 15–60 min |
| 7 | Webhook Meta | ⚠️ Manual | Callback → `.../functions/v1/meta-webhook` |
| 8 | Google OAuth | ⚠️ Manual | Habilitar provider en Supabase Auth |
| 9 | Usuario admin | ⚠️ Manual | `UPDATE profiles SET role = 'admin' WHERE id = '...'` |
| 10 | Emails (Resend) | Opcional | `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL` |

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

Ejemplo con cron externo o Supabase Scheduler (cada 15 min):

```bash
curl -X POST \
  "https://tgosnmvlvzaykiuolrot.supabase.co/functions/v1/run-automations" \
  -H "x-cron-secret: $CRON_SECRET"
```

La función:
- Resume reglas activas de `automation_rules`
- Envía emails pendientes si `RESEND_API_KEY` está configurada
- Las notificaciones de nuevos leads se crean vía trigger SQL (`on_lead_created_notify`)

## 5. Google OAuth

1. Supabase → Authentication → Providers → Google → Enable
2. Configurar Client ID/Secret de Google Cloud
3. Redirect URLs: `https://crm-vp.vercel.app`, `http://localhost:5173`
4. En la app: botón **Continuar con Google** en login

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

## 8. Verificación rápida

```bash
npm ci
npm run lint
npm run test:run
npm run build
```

En producción:
- [ ] Login email/password
- [ ] Login Google (si provider habilitado)
- [ ] CRUD cliente / lead / producto
- [ ] Pipeline drag & drop
- [ ] Notificación al crear lead
- [ ] Chat IA (con `OPENAI_API_KEY`)
- [ ] Invitar usuario (admin + `invite-user` desplegada)

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
