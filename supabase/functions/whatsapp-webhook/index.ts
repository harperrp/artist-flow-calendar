import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
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

      // Extract messages from the WhatsApp Cloud API payload
      const entries = body?.entry ?? [];
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      let leadsCreated = 0;

      for (const entry of entries) {
        const changes = entry?.changes ?? [];
        for (const change of changes) {
          if (change?.field !== "messages") continue;

          const value = change?.value;
          if (!value?.messages?.length) continue;

          const contacts = value.contacts ?? [];
          const messages = value.messages ?? [];

          for (const msg of messages) {
            const waId = msg.from; // phone number (wa_id)
            const contact = contacts.find(
              (c: any) => c.wa_id === waId
            );
            const displayName =
              contact?.profile?.name ?? `WhatsApp ${waId}`;

            // Check if a lead with this phone already exists in any org
            const { data: existing } = await supabase
              .from("leads")
              .select("id")
              .eq("contact_phone", waId)
              .maybeSingle();

            if (existing) {
              console.log(`Lead already exists for ${waId}, skipping`);
              continue;
            }

            // We need an organization_id and created_by.
            // Use the first org available (service role can query all).
            // In production, you'd map this to a specific org.
            const { data: org } = await supabase
              .from("organizations")
              .select("id, created_by")
              .limit(1)
              .single();

            if (!org) {
              console.error("No organization found");
              continue;
            }

            const messageText =
              msg.type === "text" ? msg.text?.body ?? "" : `[${msg.type}]`;

            const { error } = await supabase.from("leads").insert({
              contractor_name: displayName,
              contact_phone: waId,
              origin: "WhatsApp",
              stage: "Prospecção",
              organization_id: org.id,
              created_by: org.created_by,
              notes: `Primeira mensagem: ${messageText.substring(0, 500)}`,
            });

            if (error) {
              console.error("Error creating lead:", error.message);
            } else {
              leadsCreated++;
              console.log(`Lead created for ${displayName} (${waId})`);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true, leads_created: leadsCreated }),
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
