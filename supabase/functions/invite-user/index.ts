import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is authenticated
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) throw new Error("Unauthorized");

    const { name, email, role, organizationId } = await req.json();
    if (!name || !email || !role || !organizationId) {
      throw new Error("Missing required fields: name, email, role, organizationId");
    }

    // Verify caller is admin of the org
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: callerMembership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", caller.id)
      .eq("organization_id", organizationId)
      .single();

    if (!callerMembership || callerMembership.role !== "admin") {
      throw new Error("Only admins can invite users");
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Check if already a member
      const { data: existingMembership } = await adminClient
        .from("memberships")
        .select("id")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ error: "Usuário já é membro desta organização" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Create user with a random password (they'll reset via email)
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { display_name: name },
      });
      if (createError) throw createError;
      userId = newUser.user.id;

      // Update profile display_name
      await adminClient
        .from("profiles")
        .update({ display_name: name, email })
        .eq("id", userId);
    }

    // Create membership
    const { error: membershipError } = await adminClient
      .from("memberships")
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role,
      });

    if (membershipError) throw membershipError;

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
