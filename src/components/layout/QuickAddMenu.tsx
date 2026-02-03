import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, CalendarPlus, UserPlus, FileText, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAddMenuProps {
  onAddLead?: () => void;
  onAddEvent?: () => void;
  onAddContract?: () => void;
  onAddContact?: () => void;
}

export function QuickAddMenu({
  onAddLead,
  onAddEvent,
  onAddContract,
  onAddContact,
}: QuickAddMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleAction = (action: (() => void) | undefined, fallbackRoute?: string) => {
    setOpen(false);
    if (action) {
      action();
    } else if (fallbackRoute) {
      navigate(fallbackRoute);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Adicionar Novo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleAction(onAddLead, "/leads")}
          className="cursor-pointer gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">Novo Lead</div>
            <div className="text-xs text-muted-foreground">Adicionar oportunidade</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(onAddEvent, "/calendar")}
          className="cursor-pointer gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <CalendarPlus className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">Novo Evento</div>
            <div className="text-xs text-muted-foreground">Agendar na agenda</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(onAddContract, "/contracts")}
          className="cursor-pointer gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">Novo Contrato</div>
            <div className="text-xs text-muted-foreground">Criar contrato</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(onAddContact, "/contacts")}
          className="cursor-pointer gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">Novo Contato</div>
            <div className="text-xs text-muted-foreground">Cadastrar contato</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
