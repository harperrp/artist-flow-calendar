import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ─── GET: WhatsApp webhook verification ───
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ─── POST: process incoming messages ───
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const entries = body?.entry ?? [];
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      let leadsCreated = 0;
      let messagesStored = 0;

      for (const entry of entries) {
        const changes = entry?.changes ?? [];
        for (const change of changes) {
          if (change?.field !== "messages") continue;

          const value = change?.value;
          if (!value?.messages?.length) continue;

          const contacts = value.contacts ?? [];
          const messages = value.messages ?? [];

          for (const msg of messages) {
            const waId = msg.from;
            const contact = contacts.find((c: any) => c.wa_id === waId);
            const displayName = contact?.profile?.name ?? `WhatsApp ${waId}`;

            // Extract message content based on type
            let messageText = "";
            let messageType = msg.type || "text";
            let mediaUrl: string | null = null;

            switch (msg.type) {
              case "text":
                messageText = msg.text?.body ?? "";
                break;
              case "image":
                messageText = msg.image?.caption ?? "[Imagem]";
                mediaUrl = msg.image?.id ?? null;
                break;
              case "audio":
                messageText = "[Áudio]";
                mediaUrl = msg.audio?.id ?? null;
                break;
              case "video":
                messageText = msg.video?.caption ?? "[Vídeo]";
                mediaUrl = msg.video?.id ?? null;
                break;
              case "document":
                messageText = msg.document?.filename ?? "[Documento]";
                mediaUrl = msg.document?.id ?? null;
                break;
              case "reaction":
                messageText = `Reação: ${msg.reaction?.emoji ?? ""}`;
                messageType = "reaction";
                break;
              case "sticker":
                messageText = "[Sticker]";
                mediaUrl = msg.sticker?.id ?? null;
                break;
              default:
                messageText = `[${msg.type}]`;
            }

            // Get first org (service role can query all)
            const { data: org } = await supabase
              .from("organizations")
              .select("id, created_by")
              .limit(1)
              .single();

            if (!org) {
              console.error("No organization found");
              continue;
            }

            // Check if lead already exists
            const { data: existing } = await supabase
              .from("leads")
              .select("id")
              .eq("contact_phone", waId)
              .eq("organization_id", org.id)
              .maybeSingle();

            let leadId: string;

            if (existing) {
              leadId = existing.id;
              // Update timestamp
              await supabase
                .from("leads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", leadId);
            } else {
              // Create new lead
              const { data: newLead, error: leadErr } = await supabase
                .from("leads")
                .insert({
                  contractor_name: displayName,
                  contact_phone: waId,
                  origin: "WhatsApp",
                  stage: "Prospecção",
                  organization_id: org.id,
                  created_by: org.created_by,
                  notes: `Primeira mensagem: ${messageText.substring(0, 500)}`,
                })
                .select("id")
                .single();

              if (leadErr) {
                console.error("Error creating lead:", leadErr.message);
                continue;
              }
              leadId = newLead.id;
              leadsCreated++;
              console.log(`Lead created for ${displayName} (${waId})`);
            }

            // Store message in lead_messages
            const { error: msgErr } = await supabase
              .from("lead_messages")
              .insert({
                lead_id: leadId,
                organization_id: org.id,
                wa_id: waId,
                direction: "inbound",
                message_text: messageText.substring(0, 2000),
                message_type: messageType,
                media_url: mediaUrl,
                raw_payload: msg,
              });

            if (msgErr) {
              console.error("Error storing message:", msgErr.message);
            } else {
              messagesStored++;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, leads_created: leadsCreated, messages_stored: messagesStored }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response(
        JSON.stringify({ error: "Internal error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
