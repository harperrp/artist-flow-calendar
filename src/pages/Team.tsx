import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/providers/OrgProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, User, Mail, Phone, Eye, Edit2 } from "lucide-react";

const categories = ["Todos", "Músico", "Técnico", "Produção", "Outro"] as const;

export function TeamPage() {
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: "", role: "", category: "Músico", email: "", phone: "", tags: "" });

  const { data: members = [] } = useQuery({
    queryKey: ["team_members", activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await db
        .from("team_members")
        .select("*")
        .eq("organization_id", activeOrgId!)
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = members.filter((m: any) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.role || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Todos" || m.category === category;
    return matchSearch && matchCategory;
  });

  async function handleSave() {
    if (!form.name.trim() || !activeOrgId) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await db.from("team_members").insert({
      organization_id: activeOrgId,
      name: form.name,
      role: form.role || null,
      category: form.category,
      email: form.email || null,
      phone: form.phone || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao adicionar membro", { description: error.message });
      return;
    }
    toast.success("Membro adicionado!");
    setForm({ name: "", role: "", category: "Músico", email: "", phone: "", tags: "" });
    setDialogOpen(false);
    qc.invalidateQueries({ queryKey: ["team_members", activeOrgId] });
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">Músicos, técnicos e produção</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="grid gap-2">
                <Label>Função</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Guitarrista Principal" />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Músico">Músico</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Produção">Produção</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Violão, Backing Vocal" />
              </div>
              <Button onClick={handleSave} disabled={!form.name.trim()}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar colaboradores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            {categories.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Card className="border bg-card/70 p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member: any) => (
            <Card key={member.id} className="border bg-card/70 overflow-hidden group hover:shadow-lg transition-all">
              {/* Gradient header */}
              <div className="h-20 bg-gradient-to-r from-primary/80 to-primary relative">
                <div className="absolute top-3 right-3">
                  <div className={`h-3 w-3 rounded-full border-2 border-white ${member.is_active ? "bg-green-500" : "bg-orange-400"}`} />
                </div>
              </div>

              {/* Avatar */}
              <div className="flex justify-center -mt-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border-4 border-card">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 pt-2 text-center space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role || member.category}</p>
                </div>

                <div className="space-y-1.5 text-sm text-left">
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {member.tags && member.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {member.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-center gap-2 pt-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
