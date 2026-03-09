import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";

export interface LeadFinancialSummary {
  total: number;
  received: number;
  remaining: number;
  status: "pago" | "parcial" | "nao_pago" | "atencao" | "sem_valor";
  transactions: any[];
}

export function useLeadFinancials(orgId: string | null, leadId: string | null) {
  return useQuery({
    queryKey: ["lead-financials", orgId, leadId],
    enabled: !!orgId && !!leadId,
    queryFn: async () => {
      // Get transactions linked to this lead
      const { data: transactions, error } = await db
        .from("finance_transactions")
        .select("*")
        .eq("organization_id", orgId)
        .eq("lead_id", leadId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return (transactions ?? []) as any[];
    },
  });
}

export function useAllLeadsFinancials(orgId: string | null) {
  return useQuery({
    queryKey: ["all-leads-financials", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("finance_transactions")
        .select("*")
        .eq("organization_id", orgId)
        .not("lead_id", "is", null);

      if (error) throw error;
      
      // Group by lead_id
      const byLead: Record<string, any[]> = {};
      for (const tx of (data ?? [])) {
        if (!tx.lead_id) continue;
        if (!byLead[tx.lead_id]) byLead[tx.lead_id] = [];
        byLead[tx.lead_id].push(tx);
      }
      return byLead;
    },
  });
}

export function computeLeadFinancial(
  leadFee: number | null | undefined,
  transactions: any[]
): LeadFinancialSummary {
  const total = leadFee ?? 0;
  const incomeTransactions = transactions.filter(
    (t) => t.type === "income" && t.status !== "canceled"
  );
  const received = incomeTransactions.reduce(
    (sum: number, t: any) => sum + (t.amount || 0),
    0
  );
  const remaining = Math.max(0, total - received);

  // Check for overdue
  const now = new Date();
  const hasOverdue = transactions.some((t: any) => {
    if (t.status === "overdue") return true;
    if (t.status === "pending" && t.due_date) {
      return new Date(t.due_date) < now;
    }
    return false;
  });

  let status: LeadFinancialSummary["status"];
  if (total === 0) {
    status = "sem_valor";
  } else if (hasOverdue) {
    status = "atencao";
  } else if (received >= total) {
    status = "pago";
  } else if (received > 0) {
    status = "parcial";
  } else {
    status = "nao_pago";
  }

  return { total, received, remaining, status, transactions };
}
