#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Instalá Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
fi

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
supabase db push
echo
echo "3/3 — Desplegando Edge Functions..."
bash "$ROOT/scripts/deploy-edge-functions.sh"
echo
echo "Bootstrap CLI completado."
echo "Frontend producción: https://crm-vp.vercel.app/"
echo "Variables Vercel requeridas: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
