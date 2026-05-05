import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v23.0";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(req: Request, rawBody: string) {
  const appSecret = Deno.env.get("META_APP_SECRET");
  if (!appSecret) return true;

  const signature = req.headers.get("x-hub-signature-256") || "";
  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return `${expectedPrefix}${hex(digest)}` === signature;
}

function fieldValue(fields: Array<{ name: string; values?: string[] }>, names: string[]) {
  const wanted = names.map((n) => n.toLowerCase());
  const hit = fields.find((f) => wanted.includes(String(f.name || "").toLowerCase()));
  return hit?.values?.[0]?.trim() || "";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "Lead", last_name: "Meta" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts.at(-1) || "" };
}

async function fetchLeadDetails(leadgenId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}`);
  url.searchParams.set("fields", "id,created_time,ad_id,adgroup_id,campaign_id,form_id,field_data");
  url.searchParams.set("access_token", token);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Meta lead fetch failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function processLeadgen(admin: ReturnType<typeof createClient>, value: Record<string, unknown>) {
  const pageId = String(value.page_id || "");
  const leadgenId = String(value.leadgen_id || "");
  if (!pageId || !leadgenId) return { status: "ignored", reason: "missing page_id or leadgen_id" };

  const { data: integration, error: integrationErr } = await admin
    .from("meta_integrations")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "active")
    .maybeSingle();
  if (integrationErr) throw integrationErr;
  if (!integration) return { status: "ignored", reason: "no active integration for page" };

  const token = Deno.env.get(integration.token_ref || "META_PAGE_ACCESS_TOKEN") ||
    Deno.env.get("META_PAGE_ACCESS_TOKEN");
  if (!token) throw new Error(`Missing Meta token secret: ${integration.token_ref || "META_PAGE_ACCESS_TOKEN"}`);

  const details = await fetchLeadDetails(leadgenId, token);
  const fieldData = Array.isArray(details.field_data) ? details.field_data : [];
  const email = fieldValue(fieldData, ["email", "correo", "correo_electronico"]) ||
    `${leadgenId}@meta.local`;
  const phone = fieldValue(fieldData, ["phone", "phone_number", "telefono"]);
  const fullName = fieldValue(fieldData, ["full_name", "name", "nombre"]);
  const first = fieldValue(fieldData, ["first_name", "nombre"]);
  const last = fieldValue(fieldData, ["last_name", "apellido"]);
  const names = first || last ? { first_name: first || "Lead", last_name: last } : splitName(fullName);
  const company = fieldValue(fieldData, ["company", "empresa"]);
  const budgetRaw = fieldValue(fieldData, ["budget", "presupuesto"]);
  const budget = Number(String(budgetRaw).replace(/[^\d.]/g, "")) || 0;

  const { data: rawLead, error: rawErr } = await admin
    .from("meta_leads_raw")
    .upsert({
      user_id: integration.user_id,
      integration_id: integration.id,
      leadgen_id: leadgenId,
      page_id: pageId,
      form_id: String(details.form_id || value.form_id || ""),
      ad_id: String(details.ad_id || value.ad_id || ""),
      adgroup_id: String(details.adgroup_id || value.adgroup_id || ""),
      campaign_id: String(details.campaign_id || ""),
      created_time: details.created_time || new Date().toISOString(),
      field_data: fieldData,
      raw_payload: { webhook: value, details },
      processed_at: new Date().toISOString(),
    }, { onConflict: "leadgen_id" })
    .select()
    .single();
  if (rawErr) throw rawErr;

  const { data: existingLead } = await admin
    .from("leads")
    .select("id")
    .eq("user_id", integration.user_id)
    .eq("email", email)
    .maybeSingle();

  let crmLeadId = existingLead?.id;
  if (!crmLeadId) {
    const { data: crmLead, error: leadErr } = await admin
      .from("leads")
      .insert({
        user_id: integration.user_id,
        first_name: names.first_name,
        last_name: names.last_name,
        email,
        company,
        source: integration.default_source || "social_media",
        interest: "warm",
        score: 65,
        budget,
        status: "new",
      })
      .select("id")
      .single();
    if (leadErr) throw leadErr;
    crmLeadId = crmLead.id;
  }

  await admin.from("meta_leads_raw").update({ crm_lead_id: crmLeadId }).eq("id", rawLead.id);
  await admin.from("notifications").insert({
    user_id: integration.user_id,
    type: "meta_lead",
    title: "Nuevo lead de Meta",
    body: `${names.first_name} ${names.last_name}`.trim() || email,
    metadata: { leadgen_id: leadgenId, crm_lead_id: crmLeadId, integration_id: integration.id },
  });

  return { status: "processed", crm_lead_id: crmLeadId };
}

async function processWhatsapp(admin: ReturnType<typeof createClient>, value: Record<string, unknown>) {
  const metadata = value.metadata as Record<string, unknown> | undefined;
  const phoneNumberId = String(metadata?.phone_number_id || "");
  const messages = Array.isArray(value.messages) ? value.messages as Array<Record<string, unknown>> : [];
  const statuses = Array.isArray(value.statuses) ? value.statuses as Array<Record<string, unknown>> : [];

  if (statuses.length > 0) {
    for (const s of statuses) {
      await admin
        .from("crm_messages")
        .update({ status: String(s.status || "status"), payload: s })
        .eq("external_message_id", String(s.id || ""));
    }
    return { status: "processed", statuses: statuses.length };
  }

  if (!phoneNumberId || messages.length === 0) return { status: "ignored", reason: "no messages" };

  const { data: integration, error: integrationErr } = await admin
    .from("meta_integrations")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .eq("status", "active")
    .maybeSingle();
  if (integrationErr) throw integrationErr;
  if (!integration) return { status: "ignored", reason: "no active integration for phone" };

  const contacts = Array.isArray(value.contacts) ? value.contacts as Array<Record<string, unknown>> : [];
  for (const msg of messages) {
    const from = String(msg.from || "");
    if (!from) continue;
    const contact = contacts.find((c) => String(c.wa_id || "") === from);
    const profile = contact?.profile as Record<string, unknown> | undefined;
    const messageType = String(msg.type || "text");
    const body = messageType === "text"
      ? String((msg.text as Record<string, unknown> | undefined)?.body || "")
      : `[${messageType}]`;

    const { data: conversation, error: convErr } = await admin
      .from("crm_conversations")
      .upsert({
        user_id: integration.user_id,
        integration_id: integration.id,
        channel: "whatsapp",
        external_contact_id: from,
        contact_name: String(profile?.name || from),
        status: "open",
        last_message_at: new Date(Number(msg.timestamp || Date.now() / 1000) * 1000).toISOString(),
      }, { onConflict: "user_id,channel,external_contact_id" })
      .select()
      .single();
    if (convErr) throw convErr;

    await admin.from("crm_messages").insert({
      user_id: integration.user_id,
      conversation_id: conversation.id,
      direction: "inbound",
      external_message_id: String(msg.id || ""),
      message_type: messageType,
      body,
      payload: msg,
      sent_at: new Date(Number(msg.timestamp || Date.now() / 1000) * 1000).toISOString(),
    });
  }

  return { status: "processed", messages: messages.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === Deno.env.get("META_VERIFY_TOKEN")) {
      return new Response(challenge || "", { headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    if (!(await verifySignature(req, rawBody))) return jsonResponse({ error: "Invalid signature" }, 401);

    const payload = JSON.parse(rawBody || "{}");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) return jsonResponse({ error: "Missing service role" }, 500);
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: unknown[] = [];
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const eventKey = `${payload.object}:${entry.id}:${entry.time}:${change.field}:${JSON.stringify(change.value)}`;
        const { data: event } = await admin
          .from("meta_webhook_events")
          .upsert({
            event_key: eventKey,
            object_type: String(payload.object || ""),
            field: String(change.field || ""),
            payload: { entry, change },
          }, { onConflict: "event_key" })
          .select()
          .single();

        let result: Record<string, unknown>;
        if (change.field === "leadgen") {
          result = await processLeadgen(admin, change.value || {});
        } else if (change.field === "messages") {
          result = await processWhatsapp(admin, change.value || {});
        } else {
          result = { status: "ignored", reason: `unsupported field ${change.field}` };
        }

        await admin
          .from("meta_webhook_events")
          .update({
            status: String(result.status || "processed"),
            processed_at: new Date().toISOString(),
            error: result.status === "error" ? JSON.stringify(result) : null,
          })
          .eq("id", event?.id);
        results.push(result);
      }
    }

    return jsonResponse({ ok: true, results });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
