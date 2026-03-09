import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";

export type AppRole = "admin" | "comercial" | "financeiro" | "artista";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  comercial: "Atendente",
  financeiro: "Financeiro",
  artista: "Artista",
};

export function useUserRole() {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();

  const { data: membership, isLoading } = useQuery({
    queryKey: ["membership-role", user?.id, activeOrgId],
    enabled: !!user?.id && !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("memberships")
        .select("role")
        .eq("user_id", user!.id)
        .eq("organization_id", activeOrgId!)
        .maybeSingle();
      if (error) throw error;
      return data as { role: AppRole } | null;
    },
  });

  const role: AppRole = membership?.role ?? "comercial";

  return {
    role,
    roleLabel: ROLE_LABELS[role] || role,
    isLoading,
    isAdmin: role === "admin",
    isFinanceiro: role === "financeiro" || role === "admin",
    isAtendente: role === "comercial",
    isArtista: role === "artista",
    // Atendente can see lead fee + paid status but NOT monthly totals
    canViewFinancialDetails: role !== "artista",
    canViewFinancialTotals: role === "financeiro" || role === "admin",
    canManageFinancials: role === "financeiro" || role === "admin",
    canManageLeads: role === "comercial" || role === "admin",
    canManageTasks: role !== "artista",
  };
}

export function useOrgMembers() {
  const { activeOrgId } = useOrg();

  return useQuery({
    queryKey: ["org-members", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("memberships")
        .select("user_id, role")
        .eq("organization_id", activeOrgId!);
      if (error) throw error;

      // Fetch profiles for each member
      const userIds = (data as any[]).map((m: any) => m.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await db
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);
      if (profileError) throw profileError;

      const profileMap = new Map((profiles as any[]).map((p: any) => [p.id, p]));

      return (data as any[]).map((m: any) => ({
        userId: m.user_id,
        role: m.role as AppRole,
        roleLabel: ROLE_LABELS[m.role as AppRole] || m.role,
        email: profileMap.get(m.user_id)?.email ?? "",
        displayName: profileMap.get(m.user_id)?.display_name ?? "",
      }));
    },
  });
}
