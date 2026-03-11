import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPECTED_SUPABASE_URL = "https://uhumbtpkioisepqiqotl.supabase.co";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function maskPhone(phone: string) {
  if (!phone) return "";
  if (phone.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
}

function normalizeAndValidatePhone(rawPhone: string) {
  let digits = (rawPhone || "").replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }

  const isValid = /^55\d{10,11}$/.test(digits);
  return {
    normalized: digits,
    error: isValid
      ? null
      : "Telefone inválido. Use DDI+DDD+número (ex.: 5511999999999).",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!/^Bearer\s+.+/i.test(authHeader)) {
      throw new HttpError(401, "Missing or invalid bearer token");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    if (SUPABASE_URL !== EXPECTED_SUPABASE_URL) throw new Error(`SUPABASE_URL inválida: ${SUPABASE_URL}`);
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
    const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !caller) {
      throw new HttpError(401, "Unauthorized");
    }

    const { lead_id, text, media_url, template_id, dry_run } = await req.json();

    if (dry_run === true) {
      const checks = {
        has_supabase_url: !!SUPABASE_URL,
        has_service_role_key: !!SERVICE_ROLE_KEY,
        has_whatsapp_access_token: !!ACCESS_TOKEN,
        has_whatsapp_phone_number_id: !!PHONE_NUMBER_ID,
        supabase_url_matches_expected: SUPABASE_URL === EXPECTED_SUPABASE_URL,
      };

      const isHealthy = Object.values(checks).every(Boolean);
      return new Response(JSON.stringify({ ok: isHealthy, dry_run: true, checks }), {
        status: isHealthy ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lead_id || (!text && !media_url)) {
      return new Response(JSON.stringify({ error: "lead_id and text/media_url are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: lead, error: leadErr } = await userClient
      .from("leads")
      .select("id, organization_id, contractor_name, contact_phone, city, region, stage")
      .eq("id", lead_id)
      .single();
    if (leadErr || !lead) throw leadErr || new HttpError(404, "Lead not found");

    const { data: membership, error: membershipError } = await userClient
      .from("memberships")
      .select("role")
      .eq("user_id", caller.id)
      .eq("organization_id", lead.organization_id)
      .in("role", ["member", "admin"])
      .maybeSingle();

    if (membershipError || !membership) {
      console.warn("[wa-send-message] access denied", {
        caller_id: caller.id,
        lead_id,
        organization_id: lead.organization_id,
      });
      throw new HttpError(403, "Forbidden");
    }

    console.log("[wa-send-message] authorized request", {
      caller_id: caller.id,
      lead_id: lead.id,
      organization_id: lead.organization_id,
    });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const phone = normalizeAndValidatePhone(lead.contact_phone || "");
    const to = phone.normalized;
    if (phone.error) {
      return new Response(JSON.stringify({ error: "Este lead não possui telefone cadastrado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[wa-send-message] outbound request", {
      caller_id: caller.id,
      lead_id: lead.id,
      organization_id: lead.organization_id,
      to_masked: maskPhone(to),
      has_media: !!media_url,
      has_text: !!text,
      template_id: template_id ?? null,
    });

    const { data: pendingMessage, error: pendingError } = await supabase
      .from("lead_messages")
      .insert({
        organization_id: lead.organization_id,
        lead_id: lead.id,
        direction: "outbound",
        message_text: text || "[mídia]",
        message_type: media_url ? "image" : "text",
        media_url: media_url || null,
        wa_id: to,
        status: "pending",
        sent_at: new Date().toISOString(),
        template_id: template_id ?? null,
      })
      .select("id")
      .single();
    if (pendingError) throw pendingError;

    await supabase.from("message_queue").insert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      message_id: pendingMessage.id,
      payload: { lead_id, text, media_url, to },
      status: "processing",
      attempts: 1,
    });

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
    if (!response.ok) {
      console.error("[wa-send-message] meta api error", {
        caller_id: caller.id,
        lead_id: lead.id,
        organization_id: lead.organization_id,
        to_masked: maskPhone(to),
        status: response.status,
        status_text: response.statusText,
        meta_error: waResponse?.error ?? null,
      });
      await supabase.from("lead_messages").update({ status: "failed", error_message: waResponse?.error?.message ?? "WhatsApp API error" }).eq("id", pendingMessage.id);
      await supabase.from("message_queue").update({ status: "failed", last_error: waResponse?.error?.message ?? "WhatsApp API error" }).eq("message_id", pendingMessage.id);
      throw new Error(waResponse?.error?.message || "WhatsApp API error");
    }

    const now = new Date().toISOString();

    await supabase.from("lead_messages").update({ status: "sent", raw_payload: waResponse, sent_at: now }).eq("id", pendingMessage.id);

    await supabase.from("message_queue").update({ status: "done", updated_at: now }).eq("message_id", pendingMessage.id);

    await supabase.from("whatsapp_conversations").upsert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      contact_phone: to,
      contact_name: lead.contractor_name,
      city: lead.city,
      region: lead.region,
      stage: lead.stage,
      last_message: text || "[mídia]",
      last_message_at: now,
      updated_at: now,
    }, { onConflict: "organization_id,contact_phone" });

    await supabase.from("lead_interactions").insert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      event_type: "message_sent",
      payload: { text: text || "[mídia]", media_url: media_url || null },
    });

    await supabase.from("leads").update({
      updated_at: now,
      last_contact_at: now,
      last_message_at: now,
      last_message: text || "[mídia]",
      last_message_preview: text || "[mídia]",
      unread_count: 0,
      whatsapp_phone: to,
    }).eq("id", lead.id);

    console.log("[wa-send-message] outbound success", {
      caller_id: caller.id,
      lead_id: lead.id,
      organization_id: lead.organization_id,
      to_masked: maskPhone(to),
      meta_messages: waResponse?.messages?.map((m: any) => m?.id) ?? [],
    });

    return new Response(JSON.stringify({ ok: true, response: waResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
