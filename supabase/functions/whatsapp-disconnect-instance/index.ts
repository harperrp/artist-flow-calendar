import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { BaileysProvider } from "../_shared/whatsapp/baileys-provider.ts";

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
    const provider = new BaileysProvider(Deno.env.get("WHATSAPP_SERVER_URL")!);
    const { instanceId } = await req.json();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: instance } = await supabase.from("whatsapp_instances").select("*").eq("id", instanceId).single();
    await provider.disconnect();
    await supabase.from("whatsapp_instances").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("id", instanceId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
