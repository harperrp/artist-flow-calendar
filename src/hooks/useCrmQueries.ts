import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";

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
    queryKey: ["calendar_events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("calendar_events")
        .select("*")
        .eq("organization_id", orgId)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertCalendarEvent(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Unauthorized");

      // insert vs update by presence of id
      const { data, error } = payload.id
        ? await db
            .from("calendar_events")
            .update({ ...payload })
            .eq("id", payload.id)
            .select("*")
            .maybeSingle()
        : await db
            .from("calendar_events")
            .insert({ ...payload, organization_id: orgId, created_by: user.id })
            .select("*")
            .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar_events", orgId] });
    },
  });
}
