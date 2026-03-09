import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useOrg } from "@/providers/OrgProvider";
import { useContacts } from "@/hooks/useCrmQueries";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Phone, Mail, Building2, User, Filter, Trash2, Edit2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";

export function ContactsPage() {
  const { activeOrgId } = useOrg();
  const { data: contacts = [], isLoading } = useContacts(activeOrgId);
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({ name: "", company: "", role: "", phone: "", email: "", notes: "" });

  function resetForm() {
    setForm({ name: "", company: "", role: "", phone: "", email: "", notes: "" });
    setEditingContact(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(contact: any) {
    setEditingContact(contact);
    setForm({
      name: contact.name || "",
      company: contact.company || "",
      role: contact.role || "",
      phone: contact.phone || "",
      email: contact.email || "",
      notes: contact.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !activeOrgId) return;

    if (editingContact) {
      const { error } = await db.from("contacts").update({
        name: form.name, company: form.company || null, role: form.role || null,
        phone: form.phone || null, email: form.email || null, notes: form.notes || null,
      }).eq("id", editingContact.id);
      if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
      toast.success("Contato atualizado");
    } else {
      const { error } = await db.from("contacts").insert({
        name: form.name, company: form.company || null, role: form.role || null,
        phone: form.phone || null, email: form.email || null, notes: form.notes || null,
        organization_id: activeOrgId, created_by: user.id,
      });
      if (error) { toast.error("Erro ao criar", { description: error.message }); return; }
      toast.success("Contato criado");
    }

    setDialogOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["contacts", activeOrgId] });
  }

  async function handleDelete(id: string) {
    const { error } = await db.from("contacts").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); return; }
    toast.success("Contato excluído");
    qc.invalidateQueries({ queryKey: ["contacts", activeOrgId] });
  }

  const filtered = contacts.filter((c: any) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.company || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Base de contatos de contratantes e parceiros
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 border bg-card/70">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4 border bg-card/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{contacts.length}</div>
              <div className="text-xs text-muted-foreground">Total de contatos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {contacts.filter((c: any) => c.company).length}
              </div>
              <div className="text-xs text-muted-foreground">Com empresa</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      {contacts.length === 0 && !isLoading ? (
        <EmptyState
          icon={User}
          title="Nenhum contato cadastrado"
          description="Adicione seu primeiro contato para começar."
          action={{ label: "Novo Contato", onClick: openCreate }}
        />
      ) : (
        <Card className="border bg-card/70 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((contact: any) => (
                  <TableRow key={contact.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.company || "—"}</TableCell>
                    <TableCell>{contact.role || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(contact)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(contact.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar Contato" : "Novo Contato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do contato" />
            </div>
            <div className="grid gap-2">
              <Label>Empresa</Label>
              <Input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nome da empresa" />
            </div>
            <div className="grid gap-2">
              <Label>Função / Cargo</Label>
              <Input value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Produtor, Secretário" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionais" />
            </div>
            <Button className="mt-2" onClick={handleSave}>
              {editingContact ? "Salvar Alterações" : "Criar Contato"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
