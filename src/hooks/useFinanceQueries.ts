import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

export function useFinanceTransactions(orgId: string | null) {
  return useQuery({
    queryKey: ["finance_transactions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("finance_transactions")
        .select("*, leads:lead_id(contractor_name), contracts:contract_id(id)")
        .eq("organization_id", orgId)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertFinanceTransaction(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Unauthorized");

      const { data, error } = payload.id
        ? await db
            .from("finance_transactions")
            .update({ ...payload, id: undefined })
            .eq("id", payload.id)
            .select("*")
            .maybeSingle()
        : await db
            .from("finance_transactions")
            .insert({ ...payload, organization_id: orgId, created_by: user.id })
            .select("*")
            .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance_transactions", orgId] });
    },
  });
}

export function useDeleteFinanceTransaction(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("finance_transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance_transactions", orgId] });
    },
  });
}

export function useLeadMessages(leadId: string | null) {
  return useQuery({
    queryKey: ["lead_messages", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await db
        .from("lead_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}
