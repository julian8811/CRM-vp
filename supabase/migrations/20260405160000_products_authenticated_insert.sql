-- Permite que cualquier usuario autenticado inserte filas en `products`.
-- El esquema base solo permitía INSERT a perfiles con rol admin (política "Admins can manage products");
-- sin esta política adicional, los usuarios no admin no pueden crear productos desde la app.

-- Usar TO public + auth.uid() suele coincidir mejor con el JWT del cliente que TO authenticated solo.
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products"
  ON public.products
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);
