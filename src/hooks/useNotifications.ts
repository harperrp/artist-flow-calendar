import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000, // poll every 30s
  });
}

export function useUnreadCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n: any) => !n.is_read).length;
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useMarkAllRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useSendNotification() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      type: string;
      title: string;
      message?: string;
      entityType?: string;
      entityId?: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user || !activeOrgId) throw new Error("Unauthorized");

      const { error } = await db.from("notifications").insert({
        organization_id: activeOrgId,
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message ?? null,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
        created_by: user.id,
      });
      if (error) throw error;
    },
  });
}
