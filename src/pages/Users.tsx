import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useOrg } from "@/providers/OrgProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useOrgMembers, type AppRole } from "@/hooks/useUserRole";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Users, Wrench, Shield, MoreHorizontal, Mail,
  UserCog, Trash2,
} from "lucide-react";

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "Admin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: Shield },
  comercial: { label: "Atendente", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", icon: Users },
  financeiro: { label: "Financeiro", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", icon: Wrench },
  artista: { label: "Artista", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", icon: UserCog },
};

export function UsersPage() {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { data: members = [], isLoading } = useOrgMembers();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "comercial" as AppRole });
  const [saving, setSaving] = useState(false);

  // Role counts
  const roleCounts = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.displayName || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  });

  async function handleInvite() {
    if (!form.name.trim() || !form.email.trim() || !activeOrgId) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("invite-user", {
        body: {
          name: form.name,
          email: form.email,
          role: form.role,
          organizationId: activeOrgId,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success("Usuário adicionado com sucesso!");
      setForm({ name: "", email: "", role: "comercial" });
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["org-members", activeOrgId] });
    } catch (err: any) {
      toast.error("Erro ao adicionar usuário", { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(userId: string, newRole: AppRole) {
    if (!activeOrgId) return;
    try {
      const { error } = await db
        .from("memberships")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("organization_id", activeOrgId);
      if (error) throw error;
      toast.success("Perfil atualizado!");
      qc.invalidateQueries({ queryKey: ["org-members", activeOrgId] });
    } catch (err: any) {
      toast.error("Erro ao atualizar perfil", { description: err.message });
    }
  }

  async function handleRemove(userId: string) {
    if (!activeOrgId || userId === user?.id) return;
    try {
      const { error } = await db
        .from("memberships")
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", activeOrgId);
      if (error) throw error;
      toast.success("Usuário removido!");
      qc.invalidateQueries({ queryKey: ["org-members", activeOrgId] });
    } catch (err: any) {
      toast.error("Erro ao remover usuário", { description: err.message });
    }
  }

  const statsCards = [
    { role: "admin" as AppRole, count: roleCounts["admin"] || 0 },
    { role: "comercial" as AppRole, count: roleCounts["comercial"] || 0 },
    { role: "financeiro" as AppRole, count: roleCounts["financeiro"] || 0 },
    { role: "artista" as AppRole, count: roleCounts["artista"] || 0 },
  ];

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>Cadastre um novo usuário no sistema</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Perfil *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="comercial">Atendente</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="artista">Artista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={!form.name.trim() || !form.email.trim() || saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statsCards.map(({ role, count }) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          return (
            <Card key={role} className="flex items-center justify-between p-4 border bg-card/70">
              <div>
                <p className="text-xs text-muted-foreground">{config.label}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
              <Icon className="h-8 w-8 text-muted-foreground/40" />
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card className="border bg-card/70 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* User Table */}
      <Card className="border bg-card/70">
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Lista de Usuários</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{members.length} usuários cadastrados</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="hidden sm:table-cell">Cadastrado em</TableHead>
              {isAdmin && <TableHead className="w-12">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => {
                const config = ROLE_CONFIG[member.role];
                return (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">{member.displayName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{member.email || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium", config.color)} variant="secondary">
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      —
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(["admin", "comercial", "financeiro", "artista"] as AppRole[])
                              .filter((r) => r !== member.role)
                              .map((r) => (
                                <DropdownMenuItem key={r} onClick={() => handleChangeRole(member.userId, r)}>
                                  Alterar para {ROLE_CONFIG[r].label}
                                </DropdownMenuItem>
                              ))}
                            {member.userId !== user?.id && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemove(member.userId)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
