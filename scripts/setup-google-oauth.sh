#!/usr/bin/env bash
# Habilita Google OAuth en Supabase para CRM-VP.
# Requiere credenciales de Google Cloud Console.
#
# 1. https://console.cloud.google.com/apis/credentials
# 2. OAuth client ID → Web application
# 3. Authorized JavaScript origins:
#      https://crm-vp.vercel.app
#      http://localhost:5173
# 4. Authorized redirect URIs:
#      https://tgosnmvlvzaykiuolrot.supabase.co/auth/v1/callback
#
# Uso:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   export GOOGLE_CLIENT_ID=....apps.googleusercontent.com
#   export GOOGLE_CLIENT_SECRET=GOCSPX-...
#   bash scripts/setup-google-oauth.sh

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-tgosnmvlvzaykiuolrot}"

for var in SUPABASE_ACCESS_TOKEN GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
  if [[ -z "${!var:-}" ]]; then
    echo "Falta $var"
    exit 1
  fi
done

python3 <<PY
import json, os, urllib.request

token = os.environ["SUPABASE_ACCESS_TOKEN"]
payload = {
    "site_url": "https://crm-vp.vercel.app",
    "uri_allow_list": "https://crm-vp.vercel.app/**,http://localhost:5173/**,http://localhost:3000/**",
    "external_google_enabled": True,
    "external_google_client_id": os.environ["GOOGLE_CLIENT_ID"],
    "external_google_secret": os.environ["GOOGLE_CLIENT_SECRET"],
}
req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{os.environ.get('SUPABASE_PROJECT_REF', 'tgosnmvlvzaykiuolrot')}/config/auth",
    data=json.dumps(payload).encode(),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    method="PATCH",
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
print("Google OAuth:", data.get("external_google_enabled"))
print("site_url:", data.get("site_url"))
PY

echo "Listo. Probá «Continuar con Google» en https://crm-vp.vercel.app/"
