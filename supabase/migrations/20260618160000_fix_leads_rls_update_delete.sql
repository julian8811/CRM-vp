-- Restore missing UPDATE/DELETE policies on leads (present in initial schema but absent in production).

DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;
CREATE POLICY "Users can view leads" ON public.leads
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Admins can view all leads" ON public.leads
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Owners can update leads" ON public.leads;
CREATE POLICY "Owners can update leads" ON public.leads
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete leads" ON public.leads;
CREATE POLICY "Owners can delete leads" ON public.leads
  FOR DELETE USING (user_id = auth.uid());
