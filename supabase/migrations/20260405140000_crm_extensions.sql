-- Extensiones útiles para búsqueda
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Preferencias por usuario (IA, notificaciones en BD)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  ai_assistant_enabled boolean NOT NULL DEFAULT false,
  notification_flags jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Postventa
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  customer_label text,
  subject text NOT NULL,
  body text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS customer_label text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON public.support_tickets (created_at DESC);

-- Automatizaciones (reglas persistidas)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_config jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON public.automation_rules (user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON public.automation_rules (status);

-- Notificaciones in-app
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE read_at IS NULL;

-- Avatar en profiles (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
  END IF;
END $$;

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- user_preferences
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own" ON public.user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- support_tickets
DROP POLICY IF EXISTS "support_tickets_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_select_own" ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "support_tickets_insert_own" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_own" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "support_tickets_update_own" ON public.support_tickets;
CREATE POLICY "support_tickets_update_own" ON public.support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "support_tickets_delete_own" ON public.support_tickets;
CREATE POLICY "support_tickets_delete_own" ON public.support_tickets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- automation_rules
DROP POLICY IF EXISTS "automation_rules_select_own" ON public.automation_rules;
CREATE POLICY "automation_rules_select_own" ON public.automation_rules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "automation_rules_insert_own" ON public.automation_rules;
CREATE POLICY "automation_rules_insert_own" ON public.automation_rules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "automation_rules_update_own" ON public.automation_rules;
CREATE POLICY "automation_rules_update_own" ON public.automation_rules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "automation_rules_delete_own" ON public.automation_rules;
CREATE POLICY "automation_rules_delete_own" ON public.automation_rules FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime (idempotente: ignorar si ya está)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Búsqueda global (filtra por user_id en tablas existentes)
CREATE OR REPLACE FUNCTION public.search_crm(search_query text)
RETURNS TABLE (entity_type text, entity_id uuid, label text, subtitle text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM (
    SELECT 'customer'::text AS entity_type, c.id AS entity_id,
      c.name::text AS label,
      COALESCE(c.email, c.company, '')::text AS subtitle
    FROM public.customers c
    WHERE c.user_id = auth.uid()
      AND search_query IS NOT NULL AND length(trim(search_query)) > 0
      AND (
        c.name ILIKE '%' || search_query || '%'
        OR c.email ILIKE '%' || search_query || '%'
        OR c.company ILIKE '%' || search_query || '%'
      )
    UNION ALL
    SELECT 'lead', l.id,
      trim(l.first_name || ' ' || l.last_name)::text,
      COALESCE(l.email, l.company, '')::text
    FROM public.leads l
    WHERE l.user_id = auth.uid()
      AND search_query IS NOT NULL AND length(trim(search_query)) > 0
      AND (
        l.first_name ILIKE '%' || search_query || '%'
        OR l.last_name ILIKE '%' || search_query || '%'
        OR l.email ILIKE '%' || search_query || '%'
        OR l.company ILIKE '%' || search_query || '%'
      )
    UNION ALL
    SELECT 'order', o.id, COALESCE(o.number::text, o.id::text)::text,
      COALESCE(o.total::text, '')::text
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND search_query IS NOT NULL AND length(trim(search_query)) > 0
      AND (o.number::text ILIKE '%' || search_query || '%')
    UNION ALL
    SELECT 'quotation', q.id, COALESCE(q.number::text, q.id::text)::text,
      COALESCE(q.total::text, '')::text
    FROM public.quotations q
    WHERE q.user_id = auth.uid()
      AND search_query IS NOT NULL AND length(trim(search_query)) > 0
      AND (q.number::text ILIKE '%' || search_query || '%')
  ) sub
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.search_crm(text) TO authenticated;

-- Storage: solo si el esquema ya existe (evita ERROR 42P01 en proyectos sin Storage inicializado)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
    CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
      );

    DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
    CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);

    DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
    CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'avatars');

    DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
    CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);
  END IF;
END $$;
