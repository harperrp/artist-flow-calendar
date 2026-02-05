import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Search,
  CalendarDays,
  Handshake,
  FileText,
  Users,
  Map,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import { useOrg } from "@/providers/OrgProvider";
import { useLeads, useCalendarEvents, useContracts } from "@/hooks/useCrmQueries";
import { mockLeads, mockEvents } from "@/lib/mock-data";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();
  const { data: leads = [] } = useLeads(activeOrgId);
  const { data: events = [] } = useCalendarEvents(activeOrgId);
  const { data: contracts = [] } = useContracts(activeOrgId);

  const displayLeads = leads.length > 0 ? leads : mockLeads;
  const displayEvents = events.length > 0 ? events : mockEvents;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, to: "/app/dashboard" },
    { name: "Agenda", icon: CalendarDays, to: "/app/calendar" },
    { name: "Leads", icon: Handshake, to: "/app/leads" },
    { name: "Contratos", icon: FileText, to: "/app/contracts" },
    { name: "Contatos", icon: Users, to: "/app/contacts" },
    { name: "Mapa", icon: Map, to: "/app/map" },
    { name: "Financeiro", icon: DollarSign, to: "/app/financial" },
  ];

  function runCommand(command: () => void) {
    setOpen(false);
    command();
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex text-muted-foreground">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar leads, eventos, contratos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Navegação">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => runCommand(() => navigate(item.to))}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Leads">
            {displayLeads.slice(0, 5).map((lead: any) => (
              <CommandItem
                key={lead.id}
                onSelect={() => runCommand(() => navigate("/app/leads"))}
                className="cursor-pointer"
              >
                <Handshake className="mr-2 h-4 w-4 text-status-negotiation" />
                <span>{lead.contractor_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {lead.city}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Eventos">
            {displayEvents.slice(0, 5).map((event: any) => (
              <CommandItem
                key={event.id}
                onSelect={() => runCommand(() => navigate("/app/calendar"))}
                className="cursor-pointer"
              >
                <CalendarDays className="mr-2 h-4 w-4 text-status-confirmed" />
                <span>{event.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {event.city}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
