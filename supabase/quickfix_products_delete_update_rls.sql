-- Ejecutar en Supabase → SQL Editor si al borrar un producto reaparece al refrescar
-- (falta política RLS para DELETE / UPDATE en `products` para usuarios autenticados).

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products"
  ON public.products
  FOR UPDATE
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products"
  ON public.products
  FOR DELETE
  TO public
  USING (auth.uid() IS NOT NULL);
