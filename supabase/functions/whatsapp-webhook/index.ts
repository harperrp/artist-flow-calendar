import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { EvolutionProvider } from "../_shared/whatsapp/evolution-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const provider = new EvolutionProvider(Deno.env.get("EVOLUTION_API_URL")!, Deno.env.get("EVOLUTION_API_KEY")!);
    const payload = await req.json();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const normalized = provider.parseWebhook(payload);

    for (const message of normalized) {
      const instanceKey = String((payload?.instance as string) ?? (payload?.instanceName as string) ?? "");
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .or(`external_instance_id.eq.${instanceKey},name.eq.${instanceKey}`)
        .maybeSingle();
      if (!instance) continue;

      await supabase.from("whatsapp_webhook_events").insert({
        organization_id: instance.organization_id,
        instance_id: instance.id,
        event_type: message.eventType,
        payload,
      });

      let leadId: string | null = null;
      const phone = message.remoteJid;

      const { data: leadByPhone } = await supabase
        .from("leads")
        .select("id")
        .eq("organization_id", instance.organization_id)
        .eq("contact_phone", phone)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leadByPhone?.id) {
        leadId = leadByPhone.id;
      } else {
        const { data: org } = await supabase.from("organizations").select("id, created_by").eq("id", instance.organization_id).single();
        const { data: createdLead } = await supabase
          .from("leads")
          .insert({
            organization_id: instance.organization_id,
            created_by: org.created_by,
            contractor_name: message.pushName || "Lead WhatsApp",
            origin: "WhatsApp",
            stage: "Negociação",
            contact_phone: phone,
            whatsapp_phone: phone,
          })
          .select("id")
          .single();
        leadId = createdLead?.id ?? null;
      }

      const now = message.timestamp || new Date().toISOString();
      const preview = message.text || "[mídia]";

      const { data: chat, error: chatErr } = await supabase
        .from("whatsapp_chats")
        .upsert(
          {
            organization_id: instance.organization_id,
            instance_id: instance.id,
            lead_id: leadId,
            contact_phone: phone,
            contact_name: message.pushName ?? null,
            last_message_preview: preview,
            last_message_at: now,
            unread_count: message.direction === "inbound" ? 1 : 0,
            status: "active",
            updated_at: now,
          },
          { onConflict: "organization_id,instance_id,contact_phone" },
        )
        .select("*")
        .single();
      if (chatErr) throw chatErr;

      await supabase.from("whatsapp_messages").insert({
        organization_id: instance.organization_id,
        instance_id: instance.id,
        chat_id: chat.id,
        lead_id: leadId,
        direction: message.direction,
        message_type: message.messageType,
        body: message.text,
        provider_message_id: message.providerMessageId ?? null,
        status: "received",
        raw_payload: message.raw,
        created_at: now,
      });

      if (leadId) {
        await Promise.all([
          supabase.from("leads").update({
            last_message_at: now,
            last_message_preview: preview,
            last_message: preview,
            unread_count: message.direction === "inbound" ? 1 : 0,
            whatsapp_phone: phone,
            contact_phone: phone,
            updated_at: now,
          }).eq("id", leadId),
          supabase.from("lead_messages").insert({
            organization_id: instance.organization_id,
            lead_id: leadId,
            direction: message.direction,
            message_text: message.text,
            message_type: message.messageType,
            wa_id: phone,
            status: message.direction === "inbound" ? "received" : "sent",
            raw_payload: message.raw,
          }),
          supabase.from("whatsapp_conversations").upsert({
            organization_id: instance.organization_id,
            lead_id: leadId,
            contact_phone: phone,
            contact_name: message.pushName,
            last_message: preview,
            last_message_at: now,
            unread_count: message.direction === "inbound" ? 1 : 0,
            updated_at: now,
          }, { onConflict: "organization_id,contact_phone" }),
        ]);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
