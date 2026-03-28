import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const WHATSAPP_SERVER_URL = Deno.env.get("WHATSAPP_SERVER_URL") ?? "https://whatsapp.likedigitalmkt.com.br";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
function normalize(phone: string | null | undefined): string {
  return String(phone || "").replace(/[^\d]/g, "");
}
function resolveLeadIdFromBody(body: Record<string, unknown>): string | null {
  return (body?.lead_id || body?.leadId || null) as string | null;
}
async function resolveLeadPhone(leadId: string) {
  if (!leadId) return null;
  const { data, error } = await supabase.from("leads").select("id, organization_id, contractor_name, contact_phone, whatsapp_phone").eq("id", leadId).maybeSingle();
  if (error) { console.error("Erro ao buscar lead:", error); throw new Error("Erro ao buscar lead"); }
  if (!data) return null;
  const phone = normalize(data.whatsapp_phone || data.contact_phone || "");
  if (!phone) return null;
  return { id: data.id, organization_id: data.organization_id, name: data.contractor_name, phone };
}
async function sendViaCloud(params: { to: string; text: string; media_url?: string | null }) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) throw new Error("WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurados");
  const payload = params.media_url ? {
    messaging_product: "whatsapp", recipient_type: "individual", to: params.to, type: "image",
    image: { link: params.media_url, caption: params.text || undefined }
  } : {
    messaging_product: "whatsapp", recipient_type: "individual", to: params.to, type: "text",
    text: { body: params.text }
  };
  const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) { console.error("Erro Cloud API:", result); throw new Error(result?.error?.message || "Erro ao enviar pela Cloud API"); }
  return result;
}
async function sendViaVps(params: { to: string; text: string; media_url?: string | null }) {
  const payload = { number: params.to, phone: params.to, text: params.text, message: params.text, media_url: params.media_url ?? null };
  const tryEndpoints = [`${WHATSAPP_SERVER_URL}/send-message`, `${WHATSAPP_SERVER_URL}/message/send`, `${WHATSAPP_SERVER_URL}/send`];
  let lastError: unknown = null;
  for (const endpoint of tryEndpoints) {
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json") ? await response.json() : await response.text();
      if (!response.ok) { lastError = result; continue; }
      return { endpoint, result };
    } catch (error) { lastError = error; }
  }
  console.error("Erro VPS:", lastError);
  throw new Error("Erro ao enviar mensagem pela VPS");
}
async function saveInteraction(params: { leadId?: string | null; organizationId?: string | null; text: string; mode: string; to: string }) {
  if (!params.leadId) return;
  const channel = params.mode === "vps" ? "whatsapp_vps" : "whatsapp_cloud";
  const { error } = await supabase.from("lead_interactions").insert({
    organization_id: params.organizationId, lead_id: params.leadId, event_type: "message_sent",
    payload: { content: params.text, to: params.to, provider: params.mode, channel }
  });
  if (error) console.warn("Não foi possível salvar interaction:", error);
  const { error: leadError } = await supabase.from("leads").update({ last_contact_at: new Date().toISOString(), last_message: params.text }).eq("id", params.leadId);
  if (leadError) console.warn("Não foi possível atualizar lead:", leadError);
}
async function saveOutboundMessage(params: { leadId?: string | null; organizationId?: string | null; text: string; mode: string; to: string; media_url?: string | null; providerResponse?: unknown }) {
  if (!params.leadId) return;
  const { error } = await supabase.from("lead_messages").insert({
    organization_id: params.organizationId, lead_id: params.leadId, direction: "outbound",
    message_text: params.text, message_type: params.media_url ? "image" : "text", media_url: params.media_url,
    wa_id: params.to, raw_payload: { provider: params.mode, response: params.providerResponse },
    status: "sent", sent_at: new Date().toISOString()
  });
  if (error) console.warn("Não foi possível salvar lead_messages outbound:", error);
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const leadId = resolveLeadIdFromBody(body);
    const mode = body.mode || body.provider || "cloud";
    const text = String(body.text || body.message || "").trim();
    if (!text) return json({ error: "Mensagem não informada" }, 400);
    let to = normalize(body.to || "");
    let resolvedLead: Awaited<ReturnType<typeof resolveLeadPhone>> = null;
    if (!to && leadId) {
      resolvedLead = await resolveLeadPhone(leadId);
      if (!resolvedLead?.phone) return json({ error: "Lead sem telefone válido" }, 400);
      to = resolvedLead.phone;
    }
    if (!to) return json({ error: "Destino não informado" }, 400);
    const media_url = body.media_url ?? null;
    let providerResponse: unknown;
    if (mode === "vps") { providerResponse = await sendViaVps({ to, text, media_url }); }
    else { providerResponse = await sendViaCloud({ to, text, media_url }); }
    await saveInteraction({ leadId: leadId || resolvedLead?.id, organizationId: resolvedLead?.organization_id, text, mode, to });
    await saveOutboundMessage({ leadId: leadId || resolvedLead?.id, organizationId: resolvedLead?.organization_id, text, mode, to, media_url, providerResponse });
    return json({ success: true, mode, to, providerResponse });
  } catch (error) {
    console.error("wa-send-message error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});