import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v23.0";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

async function listFormLeads(formId: string, token: string, since?: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${formId}/leads`);
  url.searchParams.set("fields", "created_time,id,ad_id,adgroup_id,campaign_id,form_id,field_data");
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", token);
  if (since) {
    const unix = Math.floor(new Date(since).getTime() / 1000);
    if (Number.isFinite(unix)) {
      url.searchParams.set("filtering", JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: unix }]));
    }
  }

  const leads: Array<Record<string, unknown>> = [];
  let nextUrl: string | undefined = url.toString();
  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) throw new Error(`Meta form leads failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    leads.push(...(json.data || []));
    nextUrl = json.paging?.next;
  }
  return leads;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) return jsonResponse({ error: "Missing service role" }, 500);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return jsonResponse({ error: "Invalid session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const integrationId = String(body.integration_id || "");
    const formId = String(body.form_id || "");

    const { data: integration, error: integrationErr } = await userClient
      .from("meta_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (integrationErr) return jsonResponse({ error: integrationErr.message }, 400);
    if (!integration) return jsonResponse({ error: "Integración no encontrada" }, 404);

    const token = Deno.env.get(integration.token_ref || "META_PAGE_ACCESS_TOKEN") ||
      Deno.env.get("META_PAGE_ACCESS_TOKEN");
    if (!token) return jsonResponse({ error: `Falta secreto ${integration.token_ref || "META_PAGE_ACCESS_TOKEN"}` }, 500);

    const formsQuery = userClient
      .from("meta_lead_forms")
      .select("*")
      .eq("integration_id", integrationId)
      .eq("status", "active");
    const { data: forms, error: formsErr } = formId ? await formsQuery.eq("form_id", formId) : await formsQuery;
    if (formsErr) return jsonResponse({ error: formsErr.message }, 400);

    let imported = 0;
    for (const form of forms || []) {
      const leads = await listFormLeads(form.form_id, token, body.since || integration.last_sync_at);
      for (const lead of leads) {
        const fieldData = Array.isArray(lead.field_data) ? lead.field_data as Array<{ name: string; values?: string[] }> : [];
        const email = fieldValue(fieldData, ["email", "correo", "correo_electronico"]) || `${lead.id}@meta.local`;
        const fullName = fieldValue(fieldData, ["full_name", "name", "nombre"]);
        const first = fieldValue(fieldData, ["first_name", "nombre"]);
        const last = fieldValue(fieldData, ["last_name", "apellido"]);
        const names = first || last ? { first_name: first || "Lead", last_name: last } : splitName(fullName);
        const company = fieldValue(fieldData, ["company", "empresa"]);
        const budgetRaw = fieldValue(fieldData, ["budget", "presupuesto"]);
        const budget = Number(String(budgetRaw).replace(/[^\d.]/g, "")) || 0;

        const { data: existingLead } = await admin
          .from("leads")
          .select("id")
          .eq("user_id", user.id)
          .eq("email", email)
          .maybeSingle();

        let crmLeadId = existingLead?.id;
        if (!crmLeadId) {
          const { data: crmLead, error: leadErr } = await admin
            .from("leads")
            .insert({
              user_id: user.id,
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
          imported += 1;
        }

        await admin.from("meta_leads_raw").upsert({
          user_id: user.id,
          integration_id: integration.id,
          leadgen_id: String(lead.id),
          page_id: form.page_id,
          form_id: String(lead.form_id || form.form_id),
          ad_id: String(lead.ad_id || ""),
          adgroup_id: String(lead.adgroup_id || ""),
          campaign_id: String(lead.campaign_id || ""),
          created_time: lead.created_time || new Date().toISOString(),
          field_data: fieldData,
          raw_payload: lead,
          crm_lead_id: crmLeadId,
          processed_at: new Date().toISOString(),
        }, { onConflict: "leadgen_id" });
      }
    }

    await userClient
      .from("meta_integrations")
      .update({ last_sync_at: new Date().toISOString(), last_error: null })
      .eq("id", integrationId);

    return jsonResponse({ ok: true, forms: forms?.length || 0, imported });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
