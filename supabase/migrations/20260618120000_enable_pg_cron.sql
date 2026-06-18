-- Enable scheduling extensions for CRM-VP (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job itself is created via scripts/setup-cron.sh (stores secrets in Vault).
