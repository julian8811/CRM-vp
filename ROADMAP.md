# CRM-VP - Hoja de Ruta

## Estado actual: producción en Vercel

**URL:** https://crm-vp.vercel.app/

El frontend está desplegado y conectado a Supabase. Para operación completa revisá [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md).

### Páginas (14 módulos)
- Dashboard, Clientes, Leads, Pipeline, Productos, Cotizaciones, Pedidos
- Automatizaciones, Meta, Reportes, IA, Postventa, Configuración, Usuarios

### Completado en código
- Theme toggle, Command Palette (Ctrl+K), export Excel
- Supabase Auth (email + Google OAuth en UI)
- Listado de equipo (`get_team_profiles`)
- Notificaciones in-app + trigger por nuevo lead
- Edge Functions (IA, Meta, automatizaciones, invitaciones)
- Tests Vitest + CI con lint

### Pendiente de configuración (infra)
- [ ] Aplicar migración `20260618000000_production_hardening.sql` en Supabase
- [ ] Desplegar Edge Functions actualizadas (`npm run deploy:functions`)
- [ ] Configurar secretos (`OPENAI_API_KEY`, `CRON_SECRET`, `META_*`, opcional `RESEND_API_KEY`)
- [ ] Programar cron de `run-automations`
- [ ] Habilitar Google provider en Supabase Auth (si se usa OAuth)
- [ ] Configurar webhook Meta en Developers
- [ ] Asignar rol `admin` al primer usuario

### Tech stack
- React 19 + Vite + Tailwind CSS v4
- Zustand, @dnd-kit, Recharts, Supabase
- Vitest, Vercel, Supabase Edge Functions
