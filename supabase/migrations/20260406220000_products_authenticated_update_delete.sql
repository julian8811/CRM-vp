-- Permitir UPDATE y DELETE en products para usuarios autenticados (no solo admins).
-- Sin esto, el borrado desde la app puede fallar por RLS y al refrescar el producto reaparece.

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
