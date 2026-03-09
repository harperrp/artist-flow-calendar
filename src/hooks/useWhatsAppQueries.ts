import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export function useWhatsAppTemplates(orgId: string | null) {
  return useQuery({
    queryKey: ["whatsapp_templates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("whatsapp_templates")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertWhatsAppTemplate(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !orgId) throw new Error("Unauthorized");

      const next = {
        ...payload,
        organization_id: orgId,
        created_by: payload.created_by ?? user.id,
        variables: payload.variables ?? [],
      };

      const { error } = payload.id
        ? await db.from("whatsapp_templates").update(next).eq("id", payload.id)
        : await db.from("whatsapp_templates").insert(next);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp_templates", orgId] });
    },
  });
}

export function useWhatsAppFollowups(orgId: string | null, leadId?: string | null) {
  return useQuery({
    queryKey: ["whatsapp_followups", orgId, leadId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = db
        .from("whatsapp_followups")
        .select("*, whatsapp_templates(name)")
        .eq("organization_id", orgId)
        .order("due_at", { ascending: true });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateWhatsAppFollowup(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !orgId) throw new Error("Unauthorized");

      const { error } = await db.from("whatsapp_followups").insert({
        ...payload,
        organization_id: orgId,
        scheduled_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp_followups", orgId] });
    },
  });
}

export function useLeadInteractions(orgId: string | null, leadId?: string | null) {
  return useQuery({
    queryKey: ["lead_interactions", orgId, leadId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = db
        .from("lead_interactions")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLeadInteraction(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !orgId) throw new Error("Unauthorized");

      const { error } = await db.from("lead_interactions").insert({
        ...payload,
        organization_id: orgId,
        user_id: payload.user_id ?? user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lead_interactions", orgId] });
      if (variables?.lead_id) {
        qc.invalidateQueries({ queryKey: ["lead_interactions", orgId, variables.lead_id] });
      }
    },
  });
}

export function useWhatsAppInteractionStats(orgId: string | null) {
  return useQuery({
    queryKey: ["whatsapp_interaction_stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const nowIso = new Date().toISOString();
      const todayIso = todayStart.toISOString();

      const [conversationsRes, sentRes, receivedRes, noReplyRes, overdueRes] = await Promise.all([
        db.from("whatsapp_conversations").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
        db.from("lead_messages").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("direction", "outbound").gte("created_at", todayIso),
        db.from("lead_messages").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("direction", "inbound").gte("created_at", todayIso),
        db.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gt("unread_count", 0),
        db.from("whatsapp_followups").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["pending", "overdue"]).lt("due_at", nowIso),
      ]);

      return {
        activeConversations: conversationsRes.count ?? 0,
        sentToday: sentRes.count ?? 0,
        receivedToday: receivedRes.count ?? 0,
        leadsWithoutReply: noReplyRes.count ?? 0,
        overdueFollowups: overdueRes.count ?? 0,
        responseRate: (sentRes.count ?? 0) > 0 ? Math.round(((receivedRes.count ?? 0) / (sentRes.count ?? 1)) * 100) : 0,
      };
    },
  });
}
