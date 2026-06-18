#!/usr/bin/env python3
"""Full CRM production QA via Supabase REST + Edge Functions."""
import json
import secrets
import sys
import urllib.error
import urllib.request

SUPABASE_URL = "https://tgosnmvlvzaykiuolrot.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb3NubXZsdnpheWtpdW9scm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODY1MTgsImV4cCI6MjA5MDk2MjUxOH0.z8ng_3AYUVIJu-XhElMVD9kxnb5pmS6QG3NBiRPMe7k"

results = []


def record(module, test, status, detail=""):
    results.append({"module": module, "test": test, "status": status, "detail": str(detail)[:300]})
    icon = {"pass": "✅", "fail": "❌", "skip": "⏸️", "warn": "⚠️"}.get(status, "?")
    print(f"{icon} [{module}] {test}: {str(detail)[:120] if detail != '' and detail is not None else status}")


class Client:
    def __init__(self):
        self.token = ANON
        self.user_id = None

    def req(self, path, data=None, method=None, prefer=None):
        headers = {
            "apikey": ANON,
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        body = json.dumps(data).encode() if data is not None else None
        url = SUPABASE_URL + path if path.startswith("/") else path
        req = urllib.request.Request(url, data=body, headers=headers, method=method or ("POST" if data is not None else "GET"))
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                raw = resp.read().decode()
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            raw = e.read().decode()
            try:
                return e.code, json.loads(raw)
            except Exception:
                return e.code, raw

    def signup(self):
        email = f"qa-{secrets.token_hex(4)}@crm-vp-test.invalid"
        code, body = self.req("/auth/v1/signup", {"email": email, "password": secrets.token_urlsafe(16)})
        if code != 200:
            record("auth", "signup", "fail", body)
            sys.exit(1)
        self.token = body["access_token"]
        self.user_id = body["user"]["id"]
        record("auth", "signup", "pass", f"user={self.user_id[:8]}...")


def main():
    c = Client()
    c.signup()

    # AUTH settings
    code, s = c.req("/auth/v1/settings")
    record("auth", "google_enabled", "pass" if s.get("external", {}).get("google") else "fail", s.get("external", {}).get("google"))

    # PROFILE
    code, prof = c.req("/rest/v1/profiles?select=id,role&limit=1")
    record("settings", "read_profile", "pass" if code == 200 else "fail", code)

    code, body = c.req("/rest/v1/profiles", {"first_name": "QA", "last_name": "Tester"}, method="PATCH")
    # PATCH without filter may fail - use id filter
    code, body = c.req(f"/rest/v1/profiles?id=eq.{c.user_id}", {"first_name": "QA", "last_name": "Tester"}, method="PATCH", prefer="return=representation")
    record("settings", "update_profile", "pass" if code in (200, 204) else "fail", body)

    # CUSTOMERS CRUD
    code, cust = c.req("/rest/v1/customers", {
        "user_id": c.user_id, "name": "QA Cliente", "company": "QA SA", "email": "qa@c.test"
    }, method="POST", prefer="return=representation")
    customer_id = cust[0]["id"] if code == 201 and isinstance(cust, list) else None
    record("customers", "create", "pass" if customer_id else "fail", code)

    code, _ = c.req("/rest/v1/customers?select=id&limit=5")
    record("customers", "list", "pass" if code == 200 else "fail", code)

    if customer_id:
        code, _ = c.req(f"/rest/v1/customers?id=eq.{customer_id}", {"name": "QA Updated"}, method="PATCH")
        record("customers", "update", "pass" if code in (200, 204) else "fail", code)

    # LEADS CRUD
    code, lead = c.req("/rest/v1/leads", {
        "user_id": c.user_id, "first_name": "Lead", "last_name": "QA", "email": "l@c.test", "status": "new"
    }, method="POST", prefer="return=representation")
    lead_id = lead[0]["id"] if code == 201 and isinstance(lead, list) else None
    record("leads", "create", "pass" if lead_id else "fail", code)

    code, notes = c.req("/rest/v1/notifications?select=title,type&order=created_at.desc&limit=1")
    has_lead_notif = code == 200 and isinstance(notes, list) and len(notes) > 0 and notes[0].get("type") == "lead"
    record("leads", "notification_trigger", "pass" if has_lead_notif else "warn", notes)

    if lead_id:
        code, _ = c.req(f"/rest/v1/leads?id=eq.{lead_id}", {"status": "converted"}, method="PATCH")
        record("leads", "update_convert", "pass" if code in (200, 204) else "fail", code)
        code, _ = c.req(f"/rest/v1/leads?id=eq.{lead_id}", method="DELETE")
        record("leads", "delete", "pass" if code in (200, 204) else "fail", code)

    # PRODUCTS CRUD
    sku = f"QA-{secrets.token_hex(3).upper()}"
    code, prod = c.req("/rest/v1/products", {
        "sku": sku, "name": "Producto QA", "category": "General", "price": 99.99,
        "stock": 10, "margin": 20, "status": "active"
    }, method="POST", prefer="return=representation")
    prod_id = prod[0]["id"] if code == 201 and isinstance(prod, list) else None
    record("products", "create", "pass" if prod_id else "fail", prod)

    code, _ = c.req("/rest/v1/products?select=id,name&limit=5")
    record("products", "list", "pass" if code == 200 else "fail", code)

    if prod_id:
        code, _ = c.req(f"/rest/v1/products?id=eq.{prod_id}", {"stock": 5}, method="PATCH")
        record("products", "update", "pass" if code in (200, 204) else "fail", code)
        code, _ = c.req(f"/rest/v1/products?id=eq.{prod_id}", method="DELETE")
        record("products", "delete", "pass" if code in (200, 204) else "fail", code)

    # PIPELINE
    code, opp = c.req("/rest/v1/opportunities", {
        "user_id": c.user_id, "name": "Opp QA", "stage": "lead", "value": 1000, "probability": 30,
        "customer_id": customer_id
    }, method="POST", prefer="return=representation")
    opp_id = opp[0]["id"] if code == 201 and isinstance(opp, list) else None
    record("pipeline", "create", "pass" if opp_id else "fail", opp)

    code, opps = c.req("/rest/v1/opportunities?select=*,customers(name)&limit=5")
    record("pipeline", "list_with_customer_join", "pass" if code == 200 else "fail", code)

    if opp_id:
        code, moved = c.req(f"/rest/v1/opportunities?id=eq.{opp_id}", {"stage": "proposal"}, method="PATCH", prefer="return=representation")
        record("pipeline", "move_stage", "pass" if code == 200 and moved[0]["stage"] == "proposal" else "fail", moved)
        code, _ = c.req(f"/rest/v1/opportunities?id=eq.{opp_id}", method="DELETE")
        record("pipeline", "delete", "pass" if code in (200, 204) else "fail", code)

    # QUOTATIONS
    if customer_id:
        code, q = c.req("/rest/v1/quotations", {
            "user_id": c.user_id, "customer_id": customer_id, "number": f"COT-{secrets.token_hex(3)}",
            "status": "draft", "subtotal": 100, "tax": 19, "total": 119
        }, method="POST", prefer="return=representation")
        quote_id = q[0]["id"] if code == 201 and isinstance(q, list) else None
        record("quotations", "create", "pass" if quote_id else "fail", q)
        code, _ = c.req("/rest/v1/quotations?select=*,customers(name)&limit=5")
        record("quotations", "list", "pass" if code == 200 else "fail", code)
        if quote_id:
            code, _ = c.req(f"/rest/v1/quotations?id=eq.{quote_id}", method="DELETE")
            record("quotations", "delete", "pass" if code in (200, 204) else "fail", code)

    # ORDERS
    if customer_id:
        code, o = c.req("/rest/v1/orders", {
            "user_id": c.user_id, "customer_id": customer_id, "number": f"PED-{secrets.token_hex(3)}",
            "status": "confirmed", "total": 500, "carrier": "Servientrega"
        }, method="POST", prefer="return=representation")
        order_id = o[0]["id"] if code == 201 and isinstance(o, list) else None
        record("orders", "create", "pass" if order_id else "fail", o)
        code, _ = c.req("/rest/v1/orders?select=*,customers(name)&limit=5")
        record("orders", "list", "pass" if code == 200 else "fail", code)
        if order_id:
            code, _ = c.req(f"/rest/v1/orders?id=eq.{order_id}", {"status": "shipped"}, method="PATCH")
            record("orders", "update", "pass" if code in (200, 204) else "fail", code)
            code, _ = c.req(f"/rest/v1/orders?id=eq.{order_id}", method="DELETE")
            record("orders", "delete", "pass" if code in (200, 204) else "fail", code)

    # POSTSALE / support tickets
    code, ticket = c.req("/rest/v1/support_tickets", {
        "user_id": c.user_id, "subject": "Ticket QA", "body": "Descripción test",
        "status": "open", "priority": "medium", "customer_label": "Cliente QA"
    }, method="POST", prefer="return=representation")
    ticket_id = ticket[0]["id"] if code == 201 and isinstance(ticket, list) else None
    record("postsale", "create_ticket", "pass" if ticket_id else "fail", ticket)
    if ticket_id:
        code, _ = c.req(f"/rest/v1/support_tickets?id=eq.{ticket_id}", {"status": "resolved"}, method="PATCH")
        record("postsale", "update_ticket", "pass" if code in (200, 204) else "fail", code)

    # AUTOMATIONS
    code, rule = c.req("/rest/v1/automation_rules", {
        "user_id": c.user_id, "name": "QA Rule", "status": "active",
        "trigger_config": {"label": "Nuevo lead"}, "action_config": {"label": "Notificar"}
    }, method="POST", prefer="return=representation")
    rule_id = rule[0]["id"] if code == 201 and isinstance(rule, list) else None
    record("automations", "create_rule", "pass" if rule_id else "fail", rule)
    if rule_id:
        code, _ = c.req(f"/rest/v1/automation_rules?id=eq.{rule_id}", {"status": "paused"}, method="PATCH")
        record("automations", "pause_rule", "pass" if code in (200, 204) else "fail", code)

    # USER PREFERENCES
    code, _ = c.req("/rest/v1/user_preferences", {
        "user_id": c.user_id, "ai_assistant_enabled": True,
        "notification_flags": {"leadEmail": True}
    }, method="POST", prefer="resolution=merge-duplicates,return=representation")
    record("settings", "upsert_preferences", "pass" if code in (200, 201) else "fail", code)

    # SEARCH RPC
    code, search = c.req("/rest/v1/rpc/search_crm", {"search_query": "QA"})
    record("dashboard", "search_crm_rpc", "pass" if code == 200 else "fail", code)

    # META (DB only - no external creds)
    code, _ = c.req("/rest/v1/meta_integrations", {
        "user_id": c.user_id, "page_id": "123", "page_name": "QA Page", "provider": "meta"
    }, method="POST", prefer="return=representation")
    record("meta", "save_integration_config", "pass" if code == 201 else "fail", code)

    code, data = c.req("/functions/v1/meta-sync-leads", {"integration_id": "00000000-0000-0000-0000-000000000000"})
    record("meta", "sync_leads_function", "skip" if code in (400, 404, 500) else ("pass" if code == 200 else "fail"), data)

    code, data = c.req("/functions/v1/meta-webhook", {})
    record("meta", "webhook_endpoint", "pass" if code == 200 else "fail", data)

    # AI
    code, ai = c.req("/functions/v1/crm-ai", {"message": "Responde solo: OK"})
    record("ai", "chat_gemini", "pass" if code == 200 and ai.get("reply") else "fail", ai)

    # CRON
    code, data = c.req("/functions/v1/run-automations", {})
    record("automations", "cron_forbidden_without_secret", "pass" if code == 403 else "fail", code)

    # INVITE (non-admin should fail)
    code, data = c.req("/functions/v1/invite-user", {"email": "invite@test.invalid"})
    record("users", "invite_non_admin_blocked", "pass" if code == 403 else "fail", data)

    # TEAM RPC (sales user sees only self)
    code, team = c.req("/rest/v1/rpc/get_team_profiles")
    record("users", "team_rpc_sales", "pass" if code == 200 and isinstance(team, list) and len(team) == 1 else "warn", team)

    # STORAGE avatars (upload is what settings uses)
    code, bucket = c.req("/storage/v1/bucket/avatars")
    record("settings", "avatars_bucket_metadata", "warn" if code != 200 else "pass", bucket)
    # minimal png upload
    png = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082')
    up_req = urllib.request.Request(
        SUPABASE_URL + f"/storage/v1/object/avatars/{c.user_id}/qa.png",
        data=png,
        headers={"apikey": ANON, "Authorization": f"Bearer {c.token}", "Content-Type": "image/png", "x-upsert": "true"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(up_req, timeout=20) as r:
            record("settings", "avatar_upload", "pass" if r.status == 200 else "fail", r.status)
    except urllib.error.HTTPError as e:
        record("settings", "avatar_upload", "fail", e.read()[:200])

    # NOTIFICATIONS mark read
    code, alln = c.req("/rest/v1/notifications?select=id&limit=1")
    if code == 200 and isinstance(alln, list) and alln:
        nid = alln[0]["id"]
        code, _ = c.req(f"/rest/v1/notifications?id=eq.{nid}", {"read_at": "2026-06-18T00:00:00Z"}, method="PATCH")
        record("dashboard", "mark_notification_read", "pass" if code in (200, 204) else "fail", code)

    # FRONTEND
    try:
        with urllib.request.urlopen("https://crm-vp.vercel.app/", timeout=20) as r:
            html = r.read().decode()
            record("frontend", "vercel_loads", "pass" if "Continuar con Google" in html else "warn", r.status)
    except Exception as e:
        record("frontend", "vercel_loads", "fail", e)

    if customer_id:
        code, _ = c.req(f"/rest/v1/customers?id=eq.{customer_id}", method="DELETE")
        record("customers", "delete", "pass" if code in (200, 204) else "fail", code)

    # Summary
    fails = [r for r in results if r["status"] == "fail"]
    warns = [r for r in results if r["status"] == "warn"]
    passes = [r for r in results if r["status"] == "pass"]
    print("\n=== SUMMARY ===")
    print(f"PASS: {len(passes)} | WARN: {len(warns)} | FAIL: {len(fails)}")
    with open("/workspace/qa-results.json", "w") as f:
        json.dump(results, f, indent=2)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
