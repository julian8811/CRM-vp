-- Meta integrations: Lead Ads webhooks and WhatsApp conversations
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.meta_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'meta' CHECK (provider = 'meta'),
  name text NOT NULL DEFAULT 'Meta Business',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'error')),
  page_id text,
  page_name text,
  ad_account_id text,
  waba_id text,
  phone_number_id text,
  phone_number_label text,
  token_ref text NOT NULL DEFAULT 'META_PAGE_ACCESS_TOKEN',
  default_source text NOT NULL DEFAULT 'social_media',
  settings jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meta_lead_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES public.meta_integrations (id) ON DELETE CASCADE,
  page_id text NOT NULL,
  form_id text NOT NULL,
  form_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  field_mappings jsonb NOT NULL DEFAULT '{
    "email": ["email", "correo", "correo_electronico"],
    "phone": ["phone", "telefono", "phone_number"],
    "full_name": ["full_name", "nombre", "name"],
    "first_name": ["first_name", "nombre"],
    "last_name": ["last_name", "apellido"],
    "company": ["company", "empresa"],
    "budget": ["budget", "presupuesto"]
  }',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (integration_id, form_id)
);

CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text UNIQUE NOT NULL,
  integration_id uuid REFERENCES public.meta_integrations (id) ON DELETE SET NULL,
  object_type text NOT NULL,
  field text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'error')),
  payload jsonb NOT NULL DEFAULT '{}',
  error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meta_leads_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  integration_id uuid REFERENCES public.meta_integrations (id) ON DELETE SET NULL,
  leadgen_id text NOT NULL UNIQUE,
  page_id text,
  form_id text,
  ad_id text,
  adgroup_id text,
  campaign_id text,
  created_time timestamptz,
  field_data jsonb NOT NULL DEFAULT '[]',
  raw_payload jsonb NOT NULL DEFAULT '{}',
  crm_lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  integration_id uuid REFERENCES public.meta_integrations (id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook')),
  external_contact_id text NOT NULL,
  contact_name text,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, external_contact_id)
);

CREATE TABLE IF NOT EXISTS public.crm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.crm_conversations (id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound', 'status')),
  external_message_id text,
  message_type text NOT NULL DEFAULT 'text',
  body text,
  status text,
  payload jsonb NOT NULL DEFAULT '{}',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meta_integrations_user ON public.meta_integrations (user_id);
CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_integration ON public.meta_lead_forms (integration_id);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_created ON public.meta_webhook_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_leads_raw_user_created ON public.meta_leads_raw (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_leads_raw_form ON public.meta_leads_raw (form_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_user ON public.crm_conversations (user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_conversation ON public.crm_messages (conversation_id, created_at DESC);

ALTER TABLE public.meta_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_leads_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meta_integrations_select_own" ON public.meta_integrations;
CREATE POLICY "meta_integrations_select_own" ON public.meta_integrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meta_integrations_insert_own" ON public.meta_integrations;
CREATE POLICY "meta_integrations_insert_own" ON public.meta_integrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meta_integrations_update_own" ON public.meta_integrations;
CREATE POLICY "meta_integrations_update_own" ON public.meta_integrations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meta_integrations_delete_own" ON public.meta_integrations;
CREATE POLICY "meta_integrations_delete_own" ON public.meta_integrations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meta_lead_forms_select_own" ON public.meta_lead_forms;
CREATE POLICY "meta_lead_forms_select_own" ON public.meta_lead_forms FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meta_lead_forms_insert_own" ON public.meta_lead_forms;
CREATE POLICY "meta_lead_forms_insert_own" ON public.meta_lead_forms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meta_lead_forms_update_own" ON public.meta_lead_forms;
CREATE POLICY "meta_lead_forms_update_own" ON public.meta_lead_forms FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meta_lead_forms_delete_own" ON public.meta_lead_forms;
CREATE POLICY "meta_lead_forms_delete_own" ON public.meta_lead_forms FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meta_webhook_events_admin_select" ON public.meta_webhook_events;
CREATE POLICY "meta_webhook_events_admin_select" ON public.meta_webhook_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meta_integrations mi
      WHERE mi.id = meta_webhook_events.integration_id AND mi.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "meta_leads_raw_select_own" ON public.meta_leads_raw;
CREATE POLICY "meta_leads_raw_select_own" ON public.meta_leads_raw FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "crm_conversations_select_own" ON public.crm_conversations;
CREATE POLICY "crm_conversations_select_own" ON public.crm_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "crm_conversations_update_own" ON public.crm_conversations;
CREATE POLICY "crm_conversations_update_own" ON public.crm_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "crm_messages_select_own" ON public.crm_messages;
CREATE POLICY "crm_messages_select_own" ON public.crm_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "crm_messages_insert_own" ON public.crm_messages;
CREATE POLICY "crm_messages_insert_own" ON public.crm_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_meta_integrations_updated_at ON public.meta_integrations;
CREATE TRIGGER update_meta_integrations_updated_at BEFORE UPDATE ON public.meta_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_meta_lead_forms_updated_at ON public.meta_lead_forms;
CREATE TRIGGER update_meta_lead_forms_updated_at BEFORE UPDATE ON public.meta_lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_conversations_updated_at ON public.crm_conversations;
CREATE TRIGGER update_crm_conversations_updated_at BEFORE UPDATE ON public.crm_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
