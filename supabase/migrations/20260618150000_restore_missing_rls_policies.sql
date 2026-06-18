-- Restore RLS policies missing in production for pipeline, orders, quotations, activity.

-- opportunities (pipeline)
DROP POLICY IF EXISTS "Admins can view all opportunities" ON public.opportunities;
CREATE POLICY "Admins can view all opportunities" ON public.opportunities
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Users can view own opportunities" ON public.opportunities;
CREATE POLICY "Users can view own opportunities" ON public.opportunities
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can create opportunities" ON public.opportunities;
CREATE POLICY "Authenticated can create opportunities" ON public.opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update opportunities" ON public.opportunities;
CREATE POLICY "Owners can update opportunities" ON public.opportunities
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete opportunities" ON public.opportunities;
CREATE POLICY "Owners can delete opportunities" ON public.opportunities
  FOR DELETE USING (user_id = auth.uid());

-- quotations
DROP POLICY IF EXISTS "Admins can view all quotations" ON public.quotations;
CREATE POLICY "Admins can view all quotations" ON public.quotations
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Users can view own quotations" ON public.quotations;
CREATE POLICY "Users can view own quotations" ON public.quotations
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can create quotations" ON public.quotations;
CREATE POLICY "Authenticated can create quotations" ON public.quotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update quotations" ON public.quotations;
CREATE POLICY "Owners can update quotations" ON public.quotations
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete quotations" ON public.quotations;
CREATE POLICY "Owners can delete quotations" ON public.quotations
  FOR DELETE USING (user_id = auth.uid());

-- orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can create orders" ON public.orders;
CREATE POLICY "Authenticated can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can update orders" ON public.orders;
CREATE POLICY "Owners can update orders" ON public.orders
  FOR UPDATE USING (user_id = auth.uid());

-- activity_log
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
CREATE POLICY "Admins can view all activity" ON public.activity_log
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_log;
CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated can create activity" ON public.activity_log;
CREATE POLICY "Authenticated can create activity" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- avatars storage (bucket exists but policies may be absent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);
