-- Categoría de producto: texto libre (cualquier rubro), sin lista fija en BD.
-- Quitar CHECK heredado de instalaciones anteriores.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.oid, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'products'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.products
  ALTER COLUMN category SET DEFAULT 'General';
