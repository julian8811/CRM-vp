#!/usr/bin/env bash
# Programa run-automations cada 15 min vía pg_cron + Vault (Supabase hosted).
# Uso:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   bash scripts/setup-cron.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-tgosnmvlvzaykiuolrot}"
CLI="${SUPABASE_CLI:-npx supabase}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Falta SUPABASE_ACCESS_TOKEN"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN
CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 24)}"

echo "→ Configurando CRON_SECRET en Edge Functions..."
$CLI secrets set CRON_SECRET="$CRON_SECRET" --project-ref "$PROJECT_REF" >/dev/null

$CLI link --project-ref "$PROJECT_REF" >/dev/null 2>&1 || true

echo "→ Extensiones pg_cron / pg_net..."
$CLI db query --linked "create extension if not exists pg_cron with schema pg_catalog" >/dev/null
$CLI db query --linked "create extension if not exists pg_net with schema extensions" >/dev/null

echo "→ Vault secrets..."
$CLI db query --linked "select vault.create_secret('https://${PROJECT_REF}.supabase.co', 'crm_project_url', 'CRM VP project URL')" 2>/dev/null || true
$CLI db query --linked "select vault.create_secret('${CRON_SECRET}', 'crm_cron_secret', 'Cron secret for run-automations')" 2>/dev/null || true

echo "→ Cron job (cada 15 min)..."
$CLI db query --linked "select cron.unschedule('crm-vp-run-automations')" 2>/dev/null || true
$CLI db query --linked "select cron.schedule('crm-vp-run-automations', '*/15 * * * *', \$\$ select net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'crm_project_url') || '/functions/v1/run-automations', headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'crm_cron_secret')), body := '{}'::jsonb) as request_id; \$\$)" >/dev/null

echo "→ Verificación..."
$CLI db query --linked "select jobid, jobname, schedule, active from cron.job where jobname = 'crm-vp-run-automations'"
curl -s -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/run-automations" -H "x-cron-secret: ${CRON_SECRET}"
echo
echo "Listo. Guardá CRON_SECRET en un gestor de secretos (no en el repo)."
