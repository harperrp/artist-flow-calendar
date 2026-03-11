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
    const { organizationId, name } = await req.json();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const instance = await provider.createInstance({ name });
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("whatsapp_instances")
      .insert({
        organization_id: organizationId,
        name,
        external_instance_id: instance.externalId,
        provider: "evolution",
        status: instance.status,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, instance: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
