import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/**
 * Ejecuta reglas activas: crea una notificación por regla (demo de ejecución).
 * Invocación con header x-cron-secret igual a CRON_SECRET (cron externo o Supabase scheduler).
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
      .select("id, user_id, name, status")
      .eq("status", "active");

    if (rulesErr) {
      return new Response(JSON.stringify({ error: rulesErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0;
    for (const r of rules || []) {
      const { error: insErr } = await admin.from("notifications").insert({
        user_id: r.user_id,
        type: "automation",
        title: `Automatización: ${r.name}`,
        body: "Ejecución programada (run-automations). Conectá acciones reales (email, tareas) en el backend.",
        metadata: { rule_id: r.id },
      });
      if (!insErr) created += 1;
    }

    return new Response(JSON.stringify({ processed: (rules || []).length, notifications_created: created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
