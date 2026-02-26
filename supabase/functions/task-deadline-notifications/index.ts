import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // 1. Tasks due tomorrow (warning)
    const { data: dueSoon, error: e1 } = await supabase
      .from("tasks")
      .select("id, title, organization_id, assigned_to, created_by, due_date")
      .eq("is_completed", false)
      .eq("due_date", tomorrowStr);

    if (e1) throw e1;

    // 2. Tasks overdue (due_date < today)
    const { data: overdue, error: e2 } = await supabase
      .from("tasks")
      .select("id, title, organization_id, assigned_to, created_by, due_date")
      .eq("is_completed", false)
      .lt("due_date", todayStr);

    if (e2) throw e2;

    let notificationsCreated = 0;

    // Send "due soon" notifications
    for (const task of dueSoon ?? []) {
      const targetUser = task.assigned_to || task.created_by;
      if (!targetUser) continue;

      // Check if notification already sent today for this task
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("entity_id", task.id)
        .eq("entity_type", "task")
        .eq("type", "task_due_soon")
        .eq("user_id", targetUser)
        .gte("created_at", todayStr)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from("notifications").insert({
        organization_id: task.organization_id,
        user_id: targetUser,
        type: "task_due_soon",
        title: "Tarefa vence amanhã",
        message: `A tarefa "${task.title}" vence amanhã (${task.due_date}).`,
        entity_type: "task",
        entity_id: task.id,
      });
      notificationsCreated++;
    }

    // Send "overdue" notifications (once per day)
    for (const task of overdue ?? []) {
      const targetUser = task.assigned_to || task.created_by;
      if (!targetUser) continue;

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("entity_id", task.id)
        .eq("entity_type", "task")
        .eq("type", "task_overdue")
        .eq("user_id", targetUser)
        .gte("created_at", todayStr)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from("notifications").insert({
        organization_id: task.organization_id,
        user_id: targetUser,
        type: "task_overdue",
        title: "Tarefa atrasada!",
        message: `A tarefa "${task.title}" está atrasada desde ${task.due_date}.`,
        entity_type: "task",
        entity_id: task.id,
      });
      notificationsCreated++;
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated, dueSoon: dueSoon?.length ?? 0, overdue: overdue?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
