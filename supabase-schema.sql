# Schema base (referencia)

El schema completo para instalaciones nuevas está versionado en:

**`supabase/migrations/20260401000000_initial_schema.sql`**

Para proyectos existentes que ya aplicaron este archivo manualmente, marcá la migración como aplicada:

```bash
supabase migration repair --status applied 20260401000000
```

Luego ejecutá `supabase db push` para el resto de migraciones.

Ver `supabase/README.md` para el orden completo.
