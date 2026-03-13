import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "");
}
function toHex(buffer) {
  return [
    ...new Uint8Array(buffer)
  ].map((b)=>b.toString(16).padStart(2, "0")).join("");
}
async function signHmacSha256(secret, payload) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for(let i = 0; i < a.length; i++){
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
function extractMessagePayload(msg) {
  let messageText = "";
  let messageType = msg?.type || "text";
  let mediaUrl = null;
  switch(msg?.type){
    case "text":
      messageText = msg?.text?.body ?? "";
      break;
    case "image":
      messageText = msg?.image?.caption ?? "[imagem]";
      mediaUrl = msg?.image?.id ?? null;
      break;
    case "audio":
      messageText = "[áudio]";
      mediaUrl = msg?.audio?.id ?? null;
      break;
    case "video":
      messageText = msg?.video?.caption ?? "[vídeo]";
      mediaUrl = msg?.video?.id ?? null;
      break;
    case "document":
      messageText = msg?.document?.filename ?? "[documento]";
      mediaUrl = msg?.document?.id ?? null;
      break;
    case "sticker":
      messageText = "[sticker]";
      mediaUrl = msg?.sticker?.id ?? null;
      break;
    default:
      messageText = `[${msg?.type || "desconhecido"}]`;
      break;
  }
  return {
    messageText,
    messageType,
    mediaUrl
  };
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
  const WEBHOOK_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const DEFAULT_ORG_ID = Deno.env.get("WHATSAPP_DEFAULT_ORGANIZATION_ID") ?? "";
  let PHONE_MAP = {};
  try {
    PHONE_MAP = JSON.parse(Deno.env.get("WHATSAPP_PHONE_NUMBER_MAP") ?? "{}");
  } catch (e) {
    console.error("Invalid WHATSAPP_PHONE_NUMBER_MAP JSON", e);
  }
  console.log("Webhook started", {
    method: req.method,
    hasVerifyToken: !!VERIFY_TOKEN,
    hasWebhookSecret: !!WEBHOOK_SECRET,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasServiceRole: !!SERVICE_ROLE_KEY,
    defaultOrgId: DEFAULT_ORG_ID,
    phoneMapKeys: Object.keys(PHONE_MAP)
  });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase env vars");
    return json({
      error: "Missing Supabase env vars"
    }, 500);
  }
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    console.log("GET validation", {
      mode,
      token,
      challenge
    });
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "ok", {
        status: 200,
        headers: corsHeaders
      });
    }
    return new Response("Forbidden", {
      status: 403,
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const rawBody = await req.text();
    console.log("POST raw body", rawBody);
    if (WEBHOOK_SECRET) {
      const signatureHeader = req.headers.get("x-hub-signature-256") || "";
      console.log("Signature header", signatureHeader);
      if (!signatureHeader.startsWith("sha256=")) {
        console.error("Missing or invalid x-hub-signature-256 header");
        return new Response("Unauthorized", {
          status: 401,
          headers: corsHeaders
        });
      }
      const expected = await signHmacSha256(WEBHOOK_SECRET, rawBody);
      const provided = signatureHeader.slice("sha256=".length);
      const signatureMatches = timingSafeEqual(provided, expected);
      console.log("Signature compare", {
        hasSecret: !!WEBHOOK_SECRET,
        signatureMatches
      });
      if (!signatureMatches) {
        console.error("Webhook signature mismatch");
        return new Response("Unauthorized", {
          status: 401,
          headers: corsHeaders
        });
      }
    } else {
      console.log("WHATSAPP_APP_SECRET empty, signature validation skipped");
    }
    const body = rawBody ? JSON.parse(rawBody) : {};
    console.log("Parsed body", JSON.stringify(body));
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    for (const entry of body?.entry ?? []){
      console.log("Entry received", entry);
      for (const change of entry?.changes ?? []){
        console.log("Change field", change?.field);
        if (change?.field !== "messages") {
          console.log("Ignoring non-messages field", change?.field);
          continue;
        }
        const value = change?.value ?? {};
        const phoneNumberId = value?.metadata?.phone_number_id ?? "";
        console.log("PHONE NUMBER ID", phoneNumberId);
        const orgId = PHONE_MAP[phoneNumberId] ?? DEFAULT_ORG_ID;
        console.log("ORG ID resolved", {
          mapped: PHONE_MAP[phoneNumberId],
          defaultOrgId: DEFAULT_ORG_ID,
          finalOrgId: orgId
        });
        if (!orgId) {
          console.error("No organization resolved for incoming webhook");
          continue;
        }
        const { data: org, error: orgError } = await supabase.from("organizations").select("id, created_by").eq("id", orgId).maybeSingle();
        console.log("Organization lookup", {
          org,
          orgError
        });
        if (!org?.id) {
          console.error("Organization not found", {
            orgId,
            orgError
          });
          continue;
        }
        const { data: firstStage, error: stageError } = await supabase.from("funnel_stages").select("name").eq("organization_id", org.id).order("position", {
          ascending: true
        }).limit(1).maybeSingle();
        console.log("First stage lookup", {
          firstStage,
          stageError
        });
        const contacts = value?.contacts ?? [];
        const messages = value?.messages ?? [];
        const statuses = value?.statuses ?? [];
        console.log("Payload summary", {
          contactsCount: contacts.length,
          messagesCount: messages.length,
          statusesCount: statuses.length
        });
        // Atualiza status de mensagens outbound, se vierem
        for (const statusItem of statuses){
          try {
            console.log("Status payload", statusItem);
            const waId = normalizePhone(statusItem?.recipient_id ?? "");
            const statusValue = statusItem?.status ?? null;
            if (!waId || !statusValue) continue;
            const { error: statusRpcError } = await supabase.rpc("register_whatsapp_inbound", {
              _org_id: org.id,
              _lead_id: null,
              _contact_phone: waId,
              _contact_name: null,
              _stage: null,
              _message_text: `[status] ${statusValue}`,
              _message_at: new Date().toISOString()
            });
            console.log("Status RPC result", {
              statusRpcError
            });
          } catch (statusError) {
            console.error("Error processing status item", statusError);
          }
        }
        for (const msg of messages){
          try {
            console.log("Processing inbound message", msg);
            const waId = normalizePhone(msg?.from ?? "");
            if (!waId) {
              console.log("Skipping message without waId");
              continue;
            }
            const matchedContact = contacts.find((c)=>normalizePhone(c?.wa_id ?? "") === waId);
            const name = matchedContact?.profile?.name ?? "Lead WhatsApp";
            const { messageText, messageType, mediaUrl } = extractMessagePayload(msg);
            console.log("Message parsed", {
              waId,
              name,
              messageText,
              messageType,
              mediaUrl
            });
            let { data: contact, error: contactError } = await supabase.from("contacts").select("id").eq("organization_id", org.id).eq("phone", waId).maybeSingle();
            console.log("Contact lookup", {
              contact,
              contactError
            });
            if (!contact?.id) {
              const { data: newContact, error: newContactError } = await supabase.from("contacts").insert({
                organization_id: org.id,
                name,
                phone: waId,
                created_by: org.created_by
              }).select("id").single();
              console.log("Contact created", {
                newContact,
                newContactError
              });
              contact = newContact;
            }
            if (!contact?.id) {
              console.error("Could not resolve contact");
              continue;
            }
            let lead = null;
            // 1) tenta por contact_id
            {
              const { data, error } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("contact_id", contact.id).neq("stage", "Fechado").order("updated_at", {
                ascending: false
              }).limit(1).maybeSingle();
              console.log("Lead lookup by contact_id", {
                data,
                error
              });
              if (data?.id) lead = data;
            }
            // 2) fallback por whatsapp_phone
            if (!lead?.id) {
              const { data, error } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("whatsapp_phone", waId).neq("stage", "Fechado").order("updated_at", {
                ascending: false
              }).limit(1).maybeSingle();
              console.log("Lead lookup by whatsapp_phone", {
                data,
                error
              });
              if (data?.id) lead = data;
            }
            // 3) fallback por contact_phone
            if (!lead?.id) {
              const { data, error } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("contact_phone", waId).neq("stage", "Fechado").order("updated_at", {
                ascending: false
              }).limit(1).maybeSingle();
              console.log("Lead lookup by contact_phone", {
                data,
                error
              });
              if (data?.id) lead = data;
            }
            // 4) cria lead se não encontrou
            if (!lead?.id) {
              const { data: createdLead, error: createdLeadError } = await supabase.from("leads").insert({
                organization_id: org.id,
                created_by: org.created_by,
                contractor_name: name,
                origin: "WhatsApp",
                stage: firstStage?.name ?? "Negociação",
                contact_id: contact.id,
                contact_phone: waId,
                whatsapp_phone: waId
              }).select("id").single();
              console.log("Lead created", {
                createdLead,
                createdLeadError
              });
              lead = createdLead;
            }
            if (!lead?.id) {
              console.error("Could not resolve lead");
              continue;
            }
            const now = new Date().toISOString();
            const messagePreview = messageText || "[mídia]";
            const { error: messageInsertError } = await supabase.from("lead_messages").insert({
              organization_id: org.id,
              lead_id: lead.id,
              direction: "inbound",
              message_text: messageText,
              message_type: messageType,
              media_url: mediaUrl,
              wa_id: waId,
              raw_payload: msg,
              status: "received",
              delivered_at: now
            });
            console.log("Lead message insert", {
              messageInsertError
            });
            const { error: interactionInsertError } = await supabase.from("lead_interactions").insert({
              organization_id: org.id,
              lead_id: lead.id,
              event_type: "message_received",
              payload: {
                text: messagePreview,
                type: messageType
              }
            });
            console.log("Lead interaction insert", {
              interactionInsertError
            });
            const { error: rpcError } = await supabase.rpc("register_whatsapp_inbound", {
              _org_id: org.id,
              _lead_id: lead.id,
              _contact_phone: waId,
              _contact_name: name,
              _stage: firstStage?.name ?? "Negociação",
              _message_text: messagePreview,
              _message_at: now
            });
            console.log("register_whatsapp_inbound result", {
              rpcError
            });
          } catch (msgError) {
            console.error("Error processing a single inbound message", msgError);
          }
        }
      }
    }
    return json({
      ok: true
    });
  } catch (error) {
    console.error("Webhook fatal error", error);
    return json({
      error: String(error)
    }, 500);
  }
});
