#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLI="${SUPABASE_CLI:-npx supabase}"

echo "== CRM-VP bootstrap Supabase =="
echo "Proyecto remoto: tgosnmvlvzaykiuolrot"
echo

if [[ ! -f supabase/.temp/project-ref  ]] && [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Tip: ejecutá 'supabase login' y 'supabase link --project-ref tgosnmvlvzaykiuolrot'"
fi

echo "1/3 — Si es un proyecto NUEVO, aplicá el schema base en SQL Editor:"
echo "     supabase-schema.sql"
echo
echo "2/3 — Aplicando migraciones incrementales..."
$CLI db push --yes
echo
echo "3/3 — Desplegando Edge Functions..."
bash "$ROOT/scripts/deploy-edge-functions.sh"
echo
echo "Bootstrap CLI completado."
echo "Frontend producción: https://crm-vp.vercel.app/"
echo "Variables Vercel requeridas: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
