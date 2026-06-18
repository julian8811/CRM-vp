-- Ejecutar en Supabase SQL Editor si los usuarios no-admin no pueden crear productos.
-- El schema original solo permite a admins insertar en `products`.

CREATE POLICY "Authenticated users can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
