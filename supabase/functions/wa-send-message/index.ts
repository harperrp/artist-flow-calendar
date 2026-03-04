import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
    const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { lead_id, text, media_url } = await req.json();

    if (!lead_id || (!text && !media_url)) {
      return new Response(JSON.stringify({ error: "lead_id and text/media_url are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, organization_id, contact_phone")
      .eq("id", lead_id)
      .single();
    if (leadErr || !lead) throw leadErr || new Error("Lead not found");

    const to = normalizePhone(lead.contact_phone || "");
    if (!to) throw new Error("Lead without phone number");

    const payload = media_url
      ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "image",
          image: { link: media_url, caption: text || undefined },
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text },
        };

    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const waResponse = await response.json();
    if (!response.ok) throw new Error(waResponse?.error?.message || "WhatsApp API error");

    await supabase.from("lead_messages").insert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      direction: "outbound",
      message_text: text || "[mídia]",
      message_type: media_url ? "image" : "text",
      media_url: media_url || null,
      wa_id: to,
      raw_payload: waResponse,
    });

    await supabase.from("leads").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: text || "[mídia]",
    }).eq("id", lead.id);

    return new Response(JSON.stringify({ ok: true, response: waResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
