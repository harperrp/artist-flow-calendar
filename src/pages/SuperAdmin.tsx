import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OrgActionsMenu } from "@/components/super-admin/OrgActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  Search,
  Crown,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

export function SuperAdminPage() {
  const { isSuperAdmin, isLoading: checkingAdmin } = useSuperAdmin();
  const [search, setSearch] = React.useState("");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["super-admin-orgs"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data: organizations, error } = await db
        .from("organizations")
        .select("id, name, created_at, created_by")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch memberships for each org
      const orgIds = (organizations as any[]).map((o: any) => o.id);
      const { data: memberships } = await db
        .from("memberships")
        .select("organization_id, user_id, role")
        .in("organization_id", orgIds);

      // Fetch subscriptions
      const { data: subscriptions } = await db
        .from("subscriptions")
        .select("organization_id, plan, status, created_at")
        .in("organization_id", orgIds);

      // Fetch profiles for owners
      const ownerIds = [...new Set((organizations as any[]).map((o: any) => o.created_by))];
      const { data: profiles } = await db
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ownerIds);

      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.id, p]));
      const subMap = new Map((subscriptions as any[] || []).map((s: any) => [s.organization_id, s]));

      return (organizations as any[]).map((org: any) => {
        const orgMembers = (memberships as any[] || []).filter((m: any) => m.organization_id === org.id);
        const owner = profileMap.get(org.created_by);
        const sub = subMap.get(org.id);

        return {
          id: org.id,
          name: org.name,
          createdAt: org.created_at,
          ownerName: owner?.display_name || owner?.email || "—",
          ownerEmail: owner?.email || "—",
          memberCount: orgMembers.length,
          plan: sub?.plan || "sem plano",
          status: sub?.status || "inactive",
        };
      });
    },
  });

  if (checkingAdmin) return null;
  if (!isSuperAdmin) return <Navigate to="/app/dashboard" replace />;

  const filtered = (orgs || []).filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = filtered.reduce((sum, o) => sum + o.memberCount, 0);

  const planLabels: Record<string, string> = {
    starter: "Starter",
    professional: "Profissional",
    enterprise: "Enterprise",
  };

  const statusColors: Record<string, string> = {
    active: "bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30",
    paused: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    inactive: "bg-muted text-muted-foreground border-border",
    canceled: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const statusLabels: Record<string, string> = {
    active: "ATIVO",
    paused: "PAUSADO",
    inactive: "INATIVO",
    canceled: "CANCELADO",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Painel Super Admin
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os artistas e organizações cadastradas
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Artistas</p>
            <p className="text-3xl font-bold">{filtered.length}</p>
          </div>
          <Building2 className="h-8 w-8 text-primary opacity-80" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total de Usuários</p>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </div>
          <Users className="h-8 w-8 text-primary opacity-80" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
            <p className="text-3xl font-bold">
              {filtered.filter((o) => o.status === "active").length}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-status-confirmed opacity-80" />
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Lista de Artistas</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} artista{filtered.length !== 1 ? "s" : ""} cadastrado{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum artista encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{org.ownerName}</div>
                        <div className="text-xs text-muted-foreground">{org.ownerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{planLabels[org.plan] || org.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[org.status] || statusColors.inactive}>
                        {statusLabels[org.status] || "INATIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {org.memberCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(org.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <OrgActionsMenu org={org} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
