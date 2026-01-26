import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads } from "@/hooks/useCrmQueries";
import { Plus, Search, Phone, Mail, Building2, User, Filter } from "lucide-react";

// Mock contacts for demo
const mockContacts = [
  {
    id: "1",
    name: "Carlos Silva",
    company: "Prefeitura de São Paulo",
    type: "Prefeitura",
    phone: "(11) 99999-1234",
    email: "carlos@prefsp.gov.br",
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "2",
    name: "Maria Santos",
    company: "Villa Country",
    type: "Casa de Show",
    phone: "(11) 98888-5678",
    email: "maria@villacountry.com.br",
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "3",
    name: "João Oliveira",
    company: "Prefeitura de Barretos",
    type: "Prefeitura",
    phone: "(17) 97777-9012",
    email: "joao@barretos.sp.gov.br",
    city: "Barretos",
    state: "SP",
  },
  {
    id: "4",
    name: "Ana Costa",
    company: "Rodeio de Jaguariúna",
    type: "Festival",
    phone: "(19) 96666-3456",
    email: "ana@rodeio.com.br",
    city: "Jaguariúna",
    state: "SP",
  },
  {
    id: "5",
    name: "Pedro Lima",
    company: "Wood's Bar",
    type: "Casa de Show",
    phone: "(11) 95555-7890",
    email: "pedro@woodsbar.com.br",
    city: "São Paulo",
    state: "SP",
  },
  {
    id: "6",
    name: "Fernanda Alves",
    company: "Prefeitura de Ribeirão Preto",
    type: "Prefeitura",
    phone: "(16) 94444-1234",
    email: "fernanda@ribeiraopreto.sp.gov.br",
    city: "Ribeirão Preto",
    state: "SP",
  },
  {
    id: "7",
    name: "Ricardo Souza",
    company: "Expo Londrina",
    type: "Festival",
    phone: "(43) 93333-5678",
    email: "ricardo@expolondrina.com.br",
    city: "Londrina",
    state: "PR",
  },
  {
    id: "8",
    name: "Juliana Ferreira",
    company: "Caldas Country",
    type: "Festival",
    phone: "(64) 92222-9012",
    email: "juliana@caldascountry.com.br",
    city: "Caldas Novas",
    state: "GO",
  },
];

type ContactType = "all" | "Prefeitura" | "Casa de Show" | "Festival" | "Evento Privado";

export function ContactsPage() {
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Combine mock contacts with leads data
  const leadsAsContacts = leads.map((l: any) => ({
    id: l.id,
    name: l.contractor_name,
    company: l.venue_name || l.contractor_name,
    type: l.contractor_type || "Lead",
    phone: l.contact_phone || "",
    email: l.contact_email || "",
    city: l.city || "",
    state: l.state || "",
  }));

  const allContacts = [...mockContacts, ...leadsAsContacts];

  // Filter contacts
  const filteredContacts = allContacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || contact.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Prefeitura":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Casa de Show":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Festival":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Evento Privado":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Contato</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Nome do contato" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa/Organização</Label>
                <Input id="company" placeholder="Nome da empresa" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prefeitura">Prefeitura</SelectItem>
                    <SelectItem value="Casa de Show">Casa de Show</SelectItem>
                    <SelectItem value="Festival">Festival</SelectItem>
                    <SelectItem value="Evento Privado">Evento Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(00) 00000-0000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" placeholder="Cidade" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">UF</Label>
                  <Input id="state" placeholder="SP" maxLength={2} />
                </div>
              </div>
              <Button className="mt-2" onClick={() => setDialogOpen(false)}>
                Salvar Contato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4 border bg-card/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ContactType)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Prefeitura">Prefeitura</SelectItem>
                <SelectItem value="Casa de Show">Casa de Show</SelectItem>
                <SelectItem value="Festival">Festival</SelectItem>
                <SelectItem value="Evento Privado">Evento Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 border bg-card/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{allContacts.length}</div>
              <div className="text-xs text-muted-foreground">Total de contatos</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {allContacts.filter((c) => c.type === "Prefeitura").length}
              </div>
              <div className="text-xs text-muted-foreground">Prefeituras</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {allContacts.filter((c) => c.type === "Casa de Show").length}
              </div>
              <div className="text-xs text-muted-foreground">Casas de Show</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border bg-card/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {allContacts.filter((c) => c.type === "Festival").length}
              </div>
              <div className="text-xs text-muted-foreground">Festivais</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="border bg-card/70 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Contato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum contato encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeBadgeColor(contact.type)}>
                      {contact.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.city && contact.state
                      ? `${contact.city}/${contact.state}`
                      : "—"}
                  </TableCell>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
