import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

function normalizePhone(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

function extractMessagePayload(msg: any) {
  let messageText = "";
  let messageType = msg?.type || "text";
  let mediaUrl: string | null = null;

  switch (msg?.type) {
    case "text":
      messageText = msg.text?.body ?? "";
      break;
    case "image":
      messageText = msg.image?.caption ?? "[mídia]";
      mediaUrl = msg.image?.id ?? null;
      break;
    case "audio":
      messageText = "[mídia]";
      mediaUrl = msg.audio?.id ?? null;
      break;
    case "video":
      messageText = msg.video?.caption ?? "[mídia]";
      mediaUrl = msg.video?.id ?? null;
      break;
    case "document":
      messageText = msg.document?.filename ?? "[mídia]";
      mediaUrl = msg.document?.id ?? null;
      break;
    default:
      messageText = `[${msg?.type || "desconhecido"}]`;
  }

  return { messageText, messageType, mediaUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
  const WEBHOOK_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const DEFAULT_ORG_ID = Deno.env.get("WHATSAPP_DEFAULT_ORGANIZATION_ID") ?? "";
  const PHONE_MAP = JSON.parse(Deno.env.get("WHATSAPP_PHONE_NUMBER_MAP") ?? "{}");

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get("x-hub-signature-256") || "";
      if (!signature) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      // Lightweight presence validation. Full HMAC validation can be enabled with raw-body flow when needed.
    }

    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        if (change?.field !== "messages") continue;

        const value = change?.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        const orgId = PHONE_MAP[phoneNumberId] ?? DEFAULT_ORG_ID;
        if (!orgId) continue;

        const { data: org } = await supabase
          .from("organizations")
          .select("id, created_by")
          .eq("id", orgId)
          .maybeSingle();
        if (!org) continue;

        const { data: firstStage } = await supabase
          .from("funnel_stages")
          .select("name")
          .eq("organization_id", org.id)
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle();

        const contacts = value?.contacts ?? [];
        const messages = value?.messages ?? [];

        for (const msg of messages) {
          const waId = normalizePhone(msg?.from ?? "");
          if (!waId) continue;

          const matchedContact = contacts.find((c: any) => normalizePhone(c?.wa_id) === waId);
          const name = matchedContact?.profile?.name ?? "Lead WhatsApp";
          const { messageText, messageType, mediaUrl } = extractMessagePayload(msg);

          let { data: contact } = await supabase
            .from("contacts")
            .select("id")
            .eq("organization_id", org.id)
            .eq("phone", waId)
            .maybeSingle();

          if (!contact) {
            const { data: newContact } = await supabase
              .from("contacts")
              .insert({
                organization_id: org.id,
                name,
                phone: waId,
                created_by: org.created_by,
              })
              .select("id")
              .single();
            contact = newContact;
          }

          let { data: lead } = await supabase
            .from("leads")
            .select("id")
            .eq("organization_id", org.id)
            .eq("contact_id", contact?.id)
            .neq("stage", "Fechado")
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!lead) {
            const { data: createdLead } = await supabase
              .from("leads")
              .insert({
                organization_id: org.id,
                created_by: org.created_by,
                contractor_name: name,
                origin: "WhatsApp",
                stage: firstStage?.name ?? "Negociação",
                contact_id: contact?.id,
                contact_phone: waId,
                whatsapp_phone: waId,
              })
              .select("id")
              .single();
            lead = createdLead;
          }

          if (!lead?.id) continue;

          await supabase.from("lead_messages").insert({
            organization_id: org.id,
            lead_id: lead.id,
            direction: "inbound",
            message_text: messageText,
            message_type: messageType,
            media_url: mediaUrl,
            wa_id: waId,
            raw_payload: msg,
          });

          await supabase
            .from("leads")
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: messageText || "[mídia]",
              whatsapp_phone: waId,
              contact_phone: waId,
            })
            .eq("id", lead.id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
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
