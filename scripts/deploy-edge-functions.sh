#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Instalá Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "Desplegando Edge Functions a Supabase..."
supabase functions deploy crm-ai
supabase functions deploy invite-user
supabase functions deploy run-automations --no-verify-jwt
supabase functions deploy meta-webhook --no-verify-jwt
supabase functions deploy meta-sync-leads
supabase functions deploy meta-send-whatsapp

cat <<'EOF'

Funciones desplegadas. Configurá secretos en Dashboard → Edge Functions → Secrets:
  OPENAI_API_KEY
  SUPABASE_SERVICE_ROLE_KEY
  CRON_SECRET
  META_VERIFY_TOKEN
  META_APP_SECRET
  META_PAGE_ACCESS_TOKEN
  META_WHATSAPP_TOKEN
  RESEND_API_KEY            (opcional, emails desde run-automations)
  NOTIFICATION_FROM_EMAIL   (opcional, remitente para Resend)

Cron sugerido (cada 15 min):
  curl -X POST "$SUPABASE_URL/functions/v1/run-automations" -H "x-cron-secret: $CRON_SECRET"
EOF
