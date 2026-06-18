#!/usr/bin/env bash
# Configura producción CRM-VP cuando tenés credenciales de Supabase.
# Uso:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   export CRON_SECRET=$(openssl rand -hex 24)
#   # opcional: OPENAI_API_KEY, RESEND_API_KEY, META_*, SUPABASE_SERVICE_ROLE_KEY
#   bash scripts/production-setup.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PROJECT_REF="tgosnmvlvzaykiuolrot"

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  red "Falta SUPABASE_ACCESS_TOKEN"
  echo "Obtenelo en: https://supabase.com/dashboard/account/tokens"
  echo "Luego: export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

export SUPABASE_ACCESS_TOKEN
CLI="${SUPABASE_CLI:-npx supabase}"

green "1/4 — Link proyecto $PROJECT_REF"
$CLI link --project-ref "$PROJECT_REF"

green "2/4 — Aplicar migraciones"
if [[ "${SKIP_INITIAL_MIGRATION:-}" == "1" ]]; then
  $CLI migration repair --status applied 20260401000000 2>/dev/null || true
fi
$CLI db push --yes

green "3/4 — Desplegar Edge Functions"
bash "$ROOT/scripts/deploy-edge-functions.sh"

green "4/4 — Secretos (manual en Dashboard si faltan)"
cat <<EOF

Configurá en Supabase → Edge Functions → Secrets:

  Obligatorios para 100%:
    SUPABASE_SERVICE_ROLE_KEY   (Settings → API)
    CRON_SECRET                 (generá uno: openssl rand -hex 24)
    GEMINI_API_KEY              (IA — Google AI Studio)

  Meta (si usás integración):
    META_VERIFY_TOKEN, META_APP_SECRET, META_PAGE_ACCESS_TOKEN, META_WHATSAPP_TOKEN

  Emails opcionales:
    RESEND_API_KEY, NOTIFICATION_FROM_EMAIL

  Primer admin:
    UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';

  Cron (cada 15 min):
    curl -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/run-automations" \\
      -H "x-cron-secret: \$CRON_SECRET"

  Google OAuth:
    Supabase → Auth → Providers → Google → Enable
    Redirect: https://crm-vp.vercel.app

Frontend Vercel ya desplegado: https://crm-vp.vercel.app/
EOF

green "Setup CLI completado."
