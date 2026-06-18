-- Admin profile updates: explicit WITH CHECK for role changes

DROP POLICY IF EXISTS "Admins can update team profiles" ON public.profiles;
CREATE POLICY "Admins can update team profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
