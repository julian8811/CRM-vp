# Contribuir a CRM-VP

## Requisitos

- Node.js ≥ 20.19
- Cuenta Supabase (proyecto `tgosnmvlvzaykiuolrot`)
- Opcional: Supabase CLI para migraciones y functions

## Desarrollo local

```bash
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm ci
npm run dev
```

## Antes de abrir un PR

```bash
npm run lint
npm run test:run
npm run build
```

## Estructura de cambios

- **UI de una pantalla** → `src/features/<modulo>/`
- **Componentes compartidos** → `src/components/`
- **Lógica de API** → `src/lib/api.js` + `src/store/useStore.js`
- **Schema / RLS** → nueva migración en `supabase/migrations/` (nunca editar migraciones ya aplicadas)
- **Backend serverless** → `supabase/functions/<nombre>/`

## Migraciones

```bash
supabase migration new descripcion_corta
# editar el SQL generado
supabase db push
```

## Commits

- Mensajes en español o inglés, imperativo y descriptivo
- Un PR por feature o fix acotado
