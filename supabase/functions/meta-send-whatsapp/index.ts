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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return jsonResponse({ error: "Invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    const conversationId = String(body.conversation_id || "");
    const text = String(body.text || "").trim();
    if (!conversationId || !text) return jsonResponse({ error: "conversation_id y text son requeridos" }, 400);

    const { data: conversation, error: convErr } = await userClient
      .from("crm_conversations")
      .select("*, meta_integrations(*)")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (convErr) return jsonResponse({ error: convErr.message }, 400);
    if (!conversation) return jsonResponse({ error: "Conversación no encontrada" }, 404);
    if (conversation.channel !== "whatsapp") {
      return jsonResponse({ error: "Solo WhatsApp está soportado para envío por ahora" }, 400);
    }

    const integration = conversation.meta_integrations;
    const token = Deno.env.get(integration?.token_ref || "META_WHATSAPP_TOKEN") ||
      Deno.env.get("META_WHATSAPP_TOKEN") ||
      Deno.env.get("META_PAGE_ACCESS_TOKEN");
    const phoneNumberId = integration?.phone_number_id;
    if (!token || !phoneNumberId) return jsonResponse({ error: "Falta token o phone_number_id de WhatsApp" }, 500);

    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: conversation.external_contact_id,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    const meta = await res.json().catch(() => ({}));
    if (!res.ok) return jsonResponse({ error: "Meta rechazó el mensaje", detail: meta }, 502);

    const externalId = meta.messages?.[0]?.id || null;
    const { data: message, error: msgErr } = await userClient
      .from("crm_messages")
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        direction: "outbound",
        external_message_id: externalId,
        message_type: "text",
        body: text,
        status: "sent",
        payload: meta,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (msgErr) return jsonResponse({ error: msgErr.message }, 400);

    await userClient
      .from("crm_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return jsonResponse({ ok: true, message });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
