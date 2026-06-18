-- Fix infinite recursion in profiles RLS (policies querying profiles inside profiles policies)
-- and restore missing base profile policies in production.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'manager'), false);
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
CREATE POLICY "Managers can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can update team profiles" ON public.profiles;
CREATE POLICY "Admins can update team profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- customers
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers" ON public.customers
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Authenticated can create customers" ON public.customers;
CREATE POLICY "Authenticated can create customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- leads
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;
CREATE POLICY "Users can view leads" ON public.leads
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_manager());

-- products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.is_admin());

-- team RPC (avoid nested profiles RLS in SECURITY DEFINER body)
CREATE OR REPLACE FUNCTION public.get_team_profiles()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  role text,
  team text,
  avatar_url text,
  email text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.role,
    p.team,
    p.avatar_url,
    u.email::text,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE
    p.id = auth.uid()
    OR public.is_admin_or_manager()
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_profiles() TO authenticated;
