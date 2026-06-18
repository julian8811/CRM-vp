# CRM-VP - Hoja de Ruta

## Estado actual: producción en Vercel

**URL:** https://crm-vp.vercel.app/

### Completado
- Frontend en Vercel con 14 módulos CRM
- Supabase: migraciones, Edge Functions, admin asignado
- Cron `run-automations` vía `pg_cron` (cada 15 min)
- Auth: `site_url` y redirects para producción
- IA (`OPENAI_API_KEY`), notificaciones, trigger de leads

### Pendiente (requiere credenciales externas)
- [x] Google OAuth: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → `npx supabase config push`
- [ ] Meta: secretos `META_*` + webhook en Developers
- [ ] Emails Resend (opcional): `RESEND_API_KEY`

Ver [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)
