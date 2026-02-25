import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

function mapPaymentToLegacy(row: any) {
  return {
    ...row,
    type: row.type === "receita" ? "income" : "expense",
    due_date: row.vencimento,
    status:
      row.status === "pendente"
        ? "pending"
        : row.status === "pago"
          ? "paid"
          : row.status === "atrasado"
            ? "overdue"
            : "canceled",
  };
}

function mapLegacyToPayment(payload: any) {
  return {
    ...payload,
    type: payload.type === "income" ? "receita" : "despesa",
    vencimento: payload.due_date ?? null,
    due_date: undefined,
    status:
      payload.status === "pending"
        ? "pendente"
        : payload.status === "paid"
          ? "pago"
          : payload.status === "overdue"
            ? "atrasado"
            : "cancelado",
  };
}

export function useFinanceTransactions(orgId: string | null) {
  return useQuery({
    queryKey: ["payments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("payments")
        .select("*, leads:lead_id(contractor_name), contracts:contract_id(id)")
        .eq("organization_id", orgId)
        .order("vencimento", { ascending: false });
      if (error) throw error;
      return (data as any[]).map(mapPaymentToLegacy);
    },
  });
}

export function useUpsertFinanceTransaction(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Unauthorized");

      const nextPayload = mapLegacyToPayment(payload);
      const { data, error } = payload.id
        ? await db
            .from("payments")
            .update({ ...nextPayload, id: undefined })
            .eq("id", payload.id)
            .select("*")
            .maybeSingle()
        : await db
            .from("payments")
            .insert({ ...nextPayload, organization_id: orgId, created_by: user.id })
            .select("*")
            .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", orgId] });
    },
  });
}

export function useDeleteFinanceTransaction(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", orgId] });
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
