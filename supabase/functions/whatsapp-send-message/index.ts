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
    const { organizationId, chatId, instanceId, text } = await req.json();

    if (!organizationId || !chatId || !instanceId || !text) {
      return new Response(JSON.stringify({ ok: false, error: "organizationId, chatId, instanceId, text são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const [{ data: chat, error: chatError }, { data: instance, error: instanceError }] = await Promise.all([
      supabase.from("whatsapp_chats").select("*").eq("id", chatId).single(),
      supabase.from("whatsapp_instances").select("*").eq("id", instanceId).single(),
    ]);
    if (chatError || !chat) throw chatError || new Error("Chat não encontrado");
    if (instanceError || !instance) throw instanceError || new Error("Instância não encontrada");

    const pendingAt = new Date().toISOString();
    const { data: pendingMsg, error: pendingErr } = await supabase
      .from("whatsapp_messages")
      .insert({
        organization_id: organizationId,
        instance_id: instanceId,
        chat_id: chatId,
        lead_id: chat.lead_id,
        direction: "outbound",
        message_type: "text",
        body: text,
        status: "pending",
        created_at: pendingAt,
      })
      .select("*")
      .single();
    if (pendingErr) throw pendingErr;

    await supabase.from("message_queue").insert({
      organization_id: organizationId,
      lead_id: chat.lead_id,
      provider: "evolution",
      payload: { chat_id: chatId, instance_id: instanceId, text, to: chat.contact_phone },
      status: "processing",
      attempts: 1,
    });

    const providerResult = await provider.sendMessage({
      instanceExternalId: instance.external_instance_id ?? instance.name,
      to: chat.contact_phone,
      text,
    });

    const now = new Date().toISOString();
    await Promise.all([
      supabase.from("whatsapp_messages").update({ status: providerResult.status, provider_message_id: providerResult.providerMessageId, raw_payload: providerResult.raw }).eq("id", pendingMsg.id),
      supabase.from("whatsapp_chats").update({ last_message_preview: text, last_message_at: now, updated_at: now }).eq("id", chatId),
      chat.lead_id
        ? supabase.from("leads").update({
            last_message_at: now,
            last_message_preview: text,
            last_message: text,
            unread_count: 0,
            updated_at: now,
          }).eq("id", chat.lead_id)
        : Promise.resolve({}),
      chat.lead_id
        ? supabase.from("lead_messages").insert({
            organization_id: organizationId,
            lead_id: chat.lead_id,
            direction: "outbound",
            message_text: text,
            message_type: "text",
            wa_id: chat.contact_phone,
            status: "sent",
            sent_at: now,
          })
        : Promise.resolve({}),
    ]);

    return new Response(JSON.stringify({ ok: true, messageId: pendingMsg.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
