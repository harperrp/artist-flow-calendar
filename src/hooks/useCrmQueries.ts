import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

function mapEventToLegacy(row: any) {
  return {
    ...row,
    start_time: row.start_at,
    end_time: row.end_at,
    status:
      row.status === "confirmado"
        ? "confirmed"
        : row.status === "negociacao"
          ? "negotiation"
          : row.status === "bloqueado"
            ? "blocked"
            : "hold",
    contract_status:
      row.contract_status === "pendente"
        ? "pending"
        : row.contract_status === "assinado"
          ? "signed"
          : row.contract_status === "cancelado"
            ? "canceled"
            : null,
  };
}

export function useLeads(orgId: string | null) {
  return useQuery({
    queryKey: ["leads", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("leads")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useContracts(orgId: string | null) {
  return useQuery({
    queryKey: ["contracts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("contracts")
        .select("*, leads:lead_id ( contractor_name, city, state )")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCalendarEvents(orgId: string | null) {
  return useQuery({
    queryKey: ["events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("events")
        .select("*")
        .eq("organization_id", orgId)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return (data as any[]).map(mapEventToLegacy);
    },
  });
}

export function useUpsertCalendarEvent(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Unauthorized");

      const nextPayload = {
        ...payload,
        start_at: payload.start_time,
        end_at: payload.end_time,
        start_time: undefined,
        end_time: undefined,
      };

      const { data, error } = payload.id
        ? await db
            .from("events")
            .update({ ...nextPayload })
            .eq("id", payload.id)
            .select("*")
            .maybeSingle()
        : await db
            .from("events")
            .insert({ ...nextPayload, organization_id: orgId, created_by: user.id })
            .select("*")
            .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", orgId] });
    },
  });
}
