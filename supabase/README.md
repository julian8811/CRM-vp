# Supabase — CRM-VP

## Orden de aplicación

| Orden | Archivo | Cuándo |
|-------|---------|--------|
| 1 | `migrations/20260401000000_initial_schema.sql` | Proyecto **nuevo** (tablas core) |
| 2 | `migrations/20260405140000_crm_extensions.sql` | Extensiones CRM |
| 3 | `migrations/20260405160000_products_authenticated_insert.sql` | RLS productos |
| 4 | `migrations/20260406200000_products_category_free_text.sql` | Categorías libres |
| 5 | `migrations/20260406220000_products_authenticated_update_delete.sql` | Update/delete productos |
| 6 | `migrations/20260502130000_meta_integrations.sql` | Meta / WhatsApp |
| 7 | `migrations/20260618000000_production_hardening.sql` | Equipo, notificaciones lead |

### Proyecto existente (producción)

Si ya ejecutaste `supabase-schema.sql` manualmente, **omití** la migración `20260401000000` o marcala como aplicada:

```bash
supabase migration repair --status applied 20260401000000
supabase db push
```

## CLI

```bash
supabase link --project-ref tgosnmvlvzaykiuolrot
supabase db push
npm run deploy:functions
```

## Scripts legacy

Parches puntuales históricos en `scripts/legacy/` — no usar en instalaciones nuevas si las migraciones están al día.

## Edge Functions

| Función | Carpeta |
|---------|---------|
| crm-ai | `functions/crm-ai/` |
| invite-user | `functions/invite-user/` |
| run-automations | `functions/run-automations/` |
| meta-webhook | `functions/meta-webhook/` |
| meta-sync-leads | `functions/meta-sync-leads/` |
| meta-send-whatsapp | `functions/meta-send-whatsapp/` |
