import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

async function sendResendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "CRM-VP <onboarding@resend.dev>";
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not set" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { sent: false, reason: text };
  }
  return { sent: true };
}

/**
 * Ejecuta reglas activas y procesa notificaciones pendientes de email.
 * Invocación con header x-cron-secret igual a CRON_SECRET.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const headerSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || headerSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) {
      return new Response(JSON.stringify({ error: "Missing service role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: rules, error: rulesErr } = await admin
      .from("automation_rules")
      .select("id, user_id, name, status, trigger_config, action_config")
      .eq("status", "active");

    if (rulesErr) {
      return new Response(JSON.stringify({ error: rulesErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsCreated = 0;
    for (const r of rules || []) {
      const trigger = (r.trigger_config || {}) as Record<string, string>;
      const action = (r.action_config || {}) as Record<string, string>;
      const triggerType = String(trigger.type || trigger.label || "").toLowerCase();

      let body = `Ejecución programada para la regla «${r.name}».`;
      if (triggerType.includes("lead") || triggerType.includes("prospecto")) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await admin
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", r.user_id)
          .gte("created_at", since);
        body = `Regla «${r.name}»: ${count ?? 0} leads nuevos en las últimas 24h. Acción: ${action.label || action.type || "notificación"}.`;
      }

      const { error: insErr } = await admin.from("notifications").insert({
        user_id: r.user_id,
        type: "automation",
        title: `Automatización: ${r.name}`,
        body,
        metadata: { rule_id: r.id, trigger: trigger, action },
      });
      if (!insErr) notificationsCreated += 1;
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const { data: pending } = await admin
      .from("notifications")
      .select("id, user_id, title, body, metadata")
      .contains("metadata", { email_pending: true })
      .is("read_at", null)
      .limit(25);

    for (const n of pending || []) {
      const { data: userData } = await admin.auth.admin.getUserById(n.user_id);
      const email = userData?.user?.email;
      if (!email) {
        emailsFailed += 1;
        continue;
      }

      const result = await sendResendEmail(
        email,
        n.title,
        `<p>${n.body || ""}</p><p style="color:#64748b;font-size:12px">CRM-VP · https://crm-vp.vercel.app</p>`,
      );

      const metadata = { ...(n.metadata || {}), email_pending: false, email_sent_at: result.sent ? new Date().toISOString() : null };
      if (!result.sent) metadata.email_error = result.reason;

      await admin.from("notifications").update({ metadata }).eq("id", n.id);
      if (result.sent) emailsSent += 1;
      else emailsFailed += 1;
    }

    return new Response(
      JSON.stringify({
        processed_rules: (rules || []).length,
        notifications_created: notificationsCreated,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
