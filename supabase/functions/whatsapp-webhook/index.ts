import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}
function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function signHmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
}
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) { mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i); }
  return mismatch === 0;
}
function extractMessagePayload(msg: Record<string, any>): { messageText: string; messageType: string; mediaUrl: string | null } {
  let messageText = "";
  let messageType = msg?.type || "text";
  let mediaUrl: string | null = null;
  switch (msg?.type) {
    case "text": messageText = msg?.text?.body ?? ""; break;
    case "image": messageText = msg?.image?.caption ?? "[imagem]"; mediaUrl = msg?.image?.id ?? null; break;
    case "audio": messageText = "[áudio]"; mediaUrl = msg?.audio?.id ?? null; break;
    case "video": messageText = msg?.video?.caption ?? "[vídeo]"; mediaUrl = msg?.video?.id ?? null; break;
    case "document": messageText = msg?.document?.filename ?? "[documento]"; mediaUrl = msg?.document?.id ?? null; break;
    case "sticker": messageText = "[sticker]"; mediaUrl = msg?.sticker?.id ?? null; break;
    default: messageText = `[${msg?.type || "desconhecido"}]`; break;
  }
  return { messageText, messageType, mediaUrl };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
  const WEBHOOK_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const DEFAULT_ORG_ID = Deno.env.get("WHATSAPP_DEFAULT_ORGANIZATION_ID") ?? "";
  let PHONE_MAP: Record<string, string> = {};
  try { PHONE_MAP = JSON.parse(Deno.env.get("WHATSAPP_PHONE_NUMBER_MAP") ?? "{}"); } catch (e) { console.error("Invalid WHATSAPP_PHONE_NUMBER_MAP JSON", e); }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Missing Supabase env vars" }, 500);

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge ?? "ok", { status: 200, headers: corsHeaders });
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const rawBody = await req.text();
    if (WEBHOOK_SECRET) {
      const signatureHeader = req.headers.get("x-hub-signature-256") || "";
      if (!signatureHeader.startsWith("sha256=")) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      const expected = await signHmacSha256(WEBHOOK_SECRET, rawBody);
      const provided = signatureHeader.slice("sha256=".length);
      if (!timingSafeEqual(provided, expected)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const body = rawBody ? JSON.parse(rawBody) : {};
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        if (change?.field !== "messages") continue;
        const value = change?.value ?? {};
        const phoneNumberId: string = value?.metadata?.phone_number_id ?? "";
        const orgId: string = PHONE_MAP[phoneNumberId] ?? DEFAULT_ORG_ID;
        if (!orgId) continue;

        const { data: org } = await supabase.from("organizations").select("id, created_by").eq("id", orgId).maybeSingle();
        if (!org?.id) continue;

        const { data: firstStage } = await supabase.from("funnel_stages").select("name").eq("organization_id", org.id).order("position", { ascending: true }).limit(1).maybeSingle();
        const contacts: any[] = value?.contacts ?? [];
        const messages: any[] = value?.messages ?? [];
        const statuses: any[] = value?.statuses ?? [];

        for (const statusItem of statuses) {
          try {
            const waId = normalizePhone(statusItem?.recipient_id ?? "");
            const statusValue = statusItem?.status ?? null;
            if (!waId || !statusValue) continue;
            await supabase.rpc("register_whatsapp_inbound", {
              _org_id: org.id, _lead_id: null as any, _contact_phone: waId, _contact_name: null as any,
              _stage: null as any, _message_text: `[status] ${statusValue}`, _message_at: new Date().toISOString()
            });
          } catch (e) { console.error("Error processing status", e); }
        }

        for (const msg of messages) {
          try {
            const waId = normalizePhone(msg?.from ?? "");
            if (!waId) continue;
            const matchedContact = contacts.find((c: any) => normalizePhone(c?.wa_id ?? "") === waId);
            const name = matchedContact?.profile?.name ?? "Lead WhatsApp";
            const { messageText, messageType, mediaUrl } = extractMessagePayload(msg);

            let { data: contact } = await supabase.from("contacts").select("id").eq("organization_id", org.id).eq("phone", waId).maybeSingle();
            if (!contact?.id) {
              const { data: nc } = await supabase.from("contacts").insert({ organization_id: org.id, name, phone: waId, created_by: org.created_by }).select("id").single();
              contact = nc;
            }
            if (!contact?.id) continue;

            let lead: { id: string } | null = null;
            { const { data } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("contact_id", contact.id).neq("stage", "Fechado").order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (data?.id) lead = data; }
            if (!lead?.id) { const { data } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("whatsapp_phone", waId).neq("stage", "Fechado").order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (data?.id) lead = data; }
            if (!lead?.id) { const { data } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("contact_phone", waId).neq("stage", "Fechado").order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (data?.id) lead = data; }
            if (!lead?.id) {
              const { data: cl } = await supabase.from("leads").insert({
                organization_id: org.id, created_by: org.created_by, contractor_name: name, origin: "WhatsApp",
                stage: firstStage?.name ?? "Negociação", contact_id: contact.id, contact_phone: waId, whatsapp_phone: waId
              }).select("id").single();
              lead = cl;
            }
            if (!lead?.id) continue;

            const now = new Date().toISOString();
            const messagePreview = messageText || "[mídia]";
            await supabase.from("lead_messages").insert({
              organization_id: org.id, lead_id: lead.id, direction: "inbound", message_text: messageText,
              message_type: messageType, media_url: mediaUrl, wa_id: waId, raw_payload: msg, status: "received", delivered_at: now
            });
            await supabase.from("lead_interactions").insert({
              organization_id: org.id, lead_id: lead.id, event_type: "message_received", payload: { text: messagePreview, type: messageType }
            });
            await supabase.rpc("register_whatsapp_inbound", {
              _org_id: org.id, _lead_id: lead.id, _contact_phone: waId, _contact_name: name,
              _stage: firstStage?.name ?? "Negociação", _message_text: messagePreview, _message_at: now
            });
          } catch (e) { console.error("Error processing message", e); }
        }
      }
    }
    return json({ ok: true });
  } catch (error) {
    console.error("Webhook fatal error", error);
    return json({ error: String(error) }, 500);
  }
});