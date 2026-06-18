-- Production hardening: team listing, lead notifications, manager access

DROP POLICY IF EXISTS "Admins can update team profiles" ON public.profiles;
CREATE POLICY "Admins can update team profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Managers can view all profiles (admins already could)
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
CREATE POLICY "Managers can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Team directory for admins/managers (includes auth email)
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
    OR EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.id = auth.uid() AND me.role IN ('admin', 'manager')
    )
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_profiles() TO authenticated;

-- In-app notification when a lead is created (respects user preference flag)
CREATE OR REPLACE FUNCTION public.on_lead_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flags jsonb;
  notify_lead boolean;
BEGIN
  SELECT COALESCE(up.notification_flags, '{}'::jsonb)
  INTO flags
  FROM public.user_preferences up
  WHERE up.user_id = NEW.user_id;

  notify_lead := COALESCE((flags->>'leadEmail')::boolean, true);

  IF notify_lead THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      NEW.user_id,
      'lead',
      'Nuevo lead',
      trim(NEW.first_name || ' ' || NEW.last_name) || COALESCE(' · ' || NULLIF(NEW.email, ''), ''),
      jsonb_build_object(
        'lead_id', NEW.id,
        'email_pending', true,
        'recipient_hint', NEW.email
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_created_notify ON public.leads;
CREATE TRIGGER trg_lead_created_notify
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.on_lead_created_notify();
