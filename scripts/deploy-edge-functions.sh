#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLI="${SUPABASE_CLI:-npx supabase}"

echo "Desplegando Edge Functions a Supabase..."
$CLI functions deploy crm-ai
$CLI functions deploy invite-user
$CLI functions deploy run-automations --no-verify-jwt
$CLI functions deploy meta-webhook --no-verify-jwt
$CLI functions deploy meta-sync-leads
$CLI functions deploy meta-send-whatsapp

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
