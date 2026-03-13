import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return json({
      error: "Method not allowed"
    }, 405);
  }
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const DEFAULT_ORG_ID = Deno.env.get("WHATSAPP_DEFAULT_ORGANIZATION_ID") ?? "";
    console.log("ENV CHECK", {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRole: !!SERVICE_ROLE_KEY,
      defaultOrgId: DEFAULT_ORG_ID
    });
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({
        error: "Missing Supabase env vars"
      }, 500);
    }
    const body = await req.json();
    console.log("BODY RECEIVED", JSON.stringify(body));
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    if (body?.provider !== "baileys") {
      console.error("INVALID PROVIDER", body?.provider);
      return json({
        error: "Invalid provider"
      }, 400);
    }
    const orgId = DEFAULT_ORG_ID;
    if (!orgId) {
      console.error("MISSING ORG ID");
      return json({
        error: "Missing organization id"
      }, 400);
    }
    const phone = normalizePhone(body?.data?.phone ?? "");
    const text = body?.data?.text ?? "";
    const rawMessage = body?.data?.message ?? {};
    console.log("PAYLOAD PARSED", {
      phone,
      text
    });
    if (!phone) {
      console.error("MISSING PHONE");
      return json({
        error: "Missing phone"
      }, 400);
    }
    const { data: org, error: orgError } = await supabase.from("organizations").select("id, created_by").eq("id", orgId).maybeSingle();
    console.log("ORG LOOKUP", {
      org,
      orgError
    });
    if (!org?.id) {
      return json({
        error: "Organization not found",
        details: orgError
      }, 400);
    }
    const { data: firstStage, error: firstStageError } = await supabase.from("funnel_stages").select("name").eq("organization_id", org.id).order("position", {
      ascending: true
    }).limit(1).maybeSingle();
    console.log("FIRST STAGE", {
      firstStage,
      firstStageError
    });
    let { data: contact, error: contactLookupError } = await supabase.from("contacts").select("id").eq("organization_id", org.id).eq("phone", phone).maybeSingle();
    console.log("CONTACT LOOKUP", {
      contact,
      contactLookupError
    });
    if (!contact?.id) {
      const { data: newContact, error: newContactError } = await supabase.from("contacts").insert({
        organization_id: org.id,
        name: "Lead WhatsApp",
        phone,
        created_by: org.created_by
      }).select("id").single();
      console.log("CONTACT CREATED", {
        newContact,
        newContactError
      });
      contact = newContact;
      if (newContactError) {
        return json({
          error: "Error creating contact",
          details: newContactError
        }, 500);
      }
    }
    if (!contact?.id) {
      return json({
        error: "Could not resolve contact"
      }, 400);
    }
    let { data: lead, error: leadLookupError } = await supabase.from("leads").select("id").eq("organization_id", org.id).eq("contact_id", contact.id).neq("stage", "Fechado").order("updated_at", {
      ascending: false
    }).limit(1).maybeSingle();
    console.log("LEAD LOOKUP", {
      lead,
      leadLookupError
    });
    if (!lead?.id) {
      const { data: createdLead, error: createdLeadError } = await supabase.from("leads").insert({
        organization_id: org.id,
        created_by: org.created_by,
        contractor_name: "Lead WhatsApp",
        origin: "WhatsApp",
        stage: firstStage?.name ?? "Negociação",
        contact_id: contact.id,
        contact_phone: phone,
        whatsapp_phone: phone
      }).select("id").single();
      console.log("LEAD CREATED", {
        createdLead,
        createdLeadError
      });
      lead = createdLead;
      if (createdLeadError) {
        return json({
          error: "Error creating lead",
          details: createdLeadError
        }, 500);
      }
    }
    if (!lead?.id) {
      return json({
        error: "Could not resolve lead"
      }, 400);
    }
    const now = new Date().toISOString();
    const { error: leadMessageError } = await supabase.from("lead_messages").insert({
      organization_id: org.id,
      lead_id: lead.id,
      direction: "inbound",
      message_text: text,
      message_type: "text",
      media_url: null,
      wa_id: phone,
      raw_payload: body,
      status: "received",
      delivered_at: now
    });
    console.log("LEAD MESSAGE INSERT", {
      leadMessageError
    });
    if (leadMessageError) {
      return json({
        error: "Error inserting lead_messages",
        details: leadMessageError
      }, 500);
    }
    const { error: interactionError } = await supabase.from("lead_interactions").insert({
      organization_id: org.id,
      lead_id: lead.id,
      user_id: org.created_by,
      type: "message_received",
      content: text || "[mensagem]",
      payload: {
        text,
        type: "text",
        source: "whatsapp_baileys"
      }
    });
    console.log("LEAD INTERACTION INSERT", {
      interactionError
    });
    if (interactionError) {
      return json({
        error: "Error inserting lead_interactions",
        details: interactionError
      }, 500);
    }
    const { error: rpcError } = await supabase.rpc("register_whatsapp_inbound", {
      _org_id: org.id,
      _lead_id: lead.id,
      _contact_phone: phone,
      _contact_name: "Lead WhatsApp",
      _stage: firstStage?.name ?? "Negociação",
      _message_text: text || "[mensagem]",
      _message_at: now
    });
    console.log("RPC RESULT", {
      rpcError
    });
    if (rpcError) {
      return json({
        error: "Error running register_whatsapp_inbound",
        details: rpcError
      }, 500);
    }
    return json({
      ok: true,
      leadId: lead.id,
      phone,
      text
    });
  } catch (error) {
    console.error("Webhook baileys fatal error", error);
    return json({
      error: String(error)
    }, 500);
  }
});
