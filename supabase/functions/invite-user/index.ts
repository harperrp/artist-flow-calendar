import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) throw new Error("Unauthorized");
    const { name, email, role, organizationId } = await req.json();
    if (!name || !email || !role || !organizationId) throw new Error("Missing required fields: name, email, role, organizationId");
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: callerMembership } = await adminClient.from("memberships").select("role").eq("user_id", caller.id).eq("organization_id", organizationId).single();
    if (!callerMembership || callerMembership.role !== "admin") throw new Error("Only admins can invite users");
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      const { data: existingMembership } = await adminClient.from("memberships").select("id").eq("user_id", userId).eq("organization_id", organizationId).maybeSingle();
      if (existingMembership) {
        return new Response(JSON.stringify({ error: "Usuário já é membro desta organização" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { display_name: name } });
      if (createError) throw createError;
      userId = newUser.user.id;
      await adminClient.from("profiles").update({ display_name: name, email }).eq("id", userId);
    }
    const { error: membershipError } = await adminClient.from("memberships").insert({ user_id: userId, organization_id: organizationId, role });
    if (membershipError) throw membershipError;
    return new Response(JSON.stringify({ success: true, userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});