import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "@/providers/AuthProvider";

export function useSuperAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("super_admins")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  return { isSuperAdmin: data ?? false, isLoading };
}
