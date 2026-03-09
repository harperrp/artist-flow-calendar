import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export function useLeadFollowups(orgId: string | null, leadId?: string | null) {
  return useQuery({
    queryKey: ["lead_followups", orgId, leadId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = db
        .from("whatsapp_followups")
        .select("*")
        .eq("organization_id", orgId)
        .order("due_at", { ascending: true });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLeadFollowup(orgId: string | null) {
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
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lead_followups", orgId] });
      if (variables?.lead_id) {
        qc.invalidateQueries({ queryKey: ["lead_followups", orgId, variables.lead_id] });
      }
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

