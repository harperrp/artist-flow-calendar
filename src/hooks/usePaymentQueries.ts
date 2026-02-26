import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

// ---------- Payment Plans ----------
export function usePaymentPlan(orgId: string | null, leadId: string | null) {
  return useQuery({
    queryKey: ["payment_plan", orgId, leadId],
    enabled: !!orgId && !!leadId,
    queryFn: async () => {
      const { data, error } = await db
        .from("payment_plans")
        .select("*")
        .eq("organization_id", orgId)
        .eq("lead_id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertPaymentPlan(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Unauthorized");

      const { data, error } = payload.id
        ? await db
            .from("payment_plans")
            .update({ total_amount: payload.total_amount, model: payload.model, notes: payload.notes, event_id: payload.event_id ?? null })
            .eq("id", payload.id)
            .select("*")
            .single()
        : await db
            .from("payment_plans")
            .insert({ ...payload, organization_id: orgId, created_by: user.id })
            .select("*")
            .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["payment_plan", orgId, variables.lead_id] });
      qc.invalidateQueries({ queryKey: ["lead_financial_summary", orgId] });
      qc.invalidateQueries({ queryKey: ["installments"] });
    },
  });
}

// ---------- Installments ----------
export function useInstallments(orgId: string | null, planId: string | null) {
  return useQuery({
    queryKey: ["installments", orgId, planId],
    enabled: !!orgId && !!planId,
    queryFn: async () => {
      // Mark overdue first
      await db.rpc("mark_overdue_installments", { _org_id: orgId });

      const { data, error } = await db
        .from("payment_installments")
        .select("*, receipts:payment_receipts(id, file_name, file_url)")
        .eq("payment_plan_id", planId)
        .order("installment_number", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useBulkCreateInstallments(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (installments: any[]) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Unauthorized");

      const rows = installments.map((inst) => ({
        ...inst,
        organization_id: orgId,
        created_by: user.id,
      }));

      const { error } = await db.from("payment_installments").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
      qc.invalidateQueries({ queryKey: ["lead_financial_summary"] });
    },
  });
}

export function useMarkInstallmentPaid(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; paid_at: string; payment_method: string; notes?: string; paid_amount?: number }) => {
      const { error } = await db
        .from("payment_installments")
        .update({
          status: "pago",
          paid_at: payload.paid_at,
          payment_method: payload.payment_method,
          paid_amount: payload.paid_amount,
          notes: payload.notes,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
      qc.invalidateQueries({ queryKey: ["lead_financial_summary"] });
    },
  });
}

export function useCancelInstallment(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("payment_installments")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
      qc.invalidateQueries({ queryKey: ["lead_financial_summary"] });
    },
  });
}

// ---------- Receipts ----------
export function useUploadReceipt(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { installment_id: string; file: File }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !orgId) throw new Error("Unauthorized");

      const filePath = `org/${orgId}/installments/${payload.installment_id}/${Date.now()}_${payload.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, payload.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

      const { error } = await db.from("payment_receipts").insert({
        organization_id: orgId,
        installment_id: payload.installment_id,
        file_url: urlData.publicUrl,
        file_name: payload.file.name,
        mime_type: payload.file.type,
        file_size: payload.file.size,
        uploaded_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
    },
  });
}

// ---------- Financial Summary ----------
export function useLeadFinancialSummaries(orgId: string | null) {
  return useQuery({
    queryKey: ["lead_financial_summary", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Mark overdue first
      await db.rpc("mark_overdue_installments", { _org_id: orgId });

      const { data, error } = await db
        .from("lead_financial_summary")
        .select("*")
        .eq("organization_id", orgId);
      if (error) throw error;
      return data as any[];
    },
  });
}
