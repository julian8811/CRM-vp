-- Ejecutar UNA VEZ en Supabase → SQL Editor (mismo proyecto que usa la app).
-- Corrige: "viola la restricción de verificación products_category_check"
-- Tras esto podrás guardar categorías como "Baño seco" u otras libres.

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- Por si el nombre del CHECK en tu BD es distinto, quita cualquier CHECK solo sobre category:
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'products'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.products
  ALTER COLUMN category SET DEFAULT 'General';
