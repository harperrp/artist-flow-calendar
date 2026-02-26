import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  Handshake,
  FileText,
  LogOut,
  LayoutDashboard,
  Map,
  DollarSign,
  Users,
  UsersRound,
  UserCog,
  ListChecks,
  Menu,
  X,
  Music,
} from "lucide-react";
import { useState } from "react";
import { QuickAddMenu } from "./QuickAddMenu";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch } from "@/components/ui/global-search";

function TopNavItem({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { user } = useAuth();
  const { profile } = useOrg();
  const { role, roleLabel, canViewFinancialTotals, canManageLeads, isArtista } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allNavItems = [
    { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "comercial", "financeiro", "artista"] },
    { to: "/app/artist", icon: Music, label: "Painel Artista", roles: ["artista", "admin"] },
    { to: "/app/calendar", icon: CalendarDays, label: "Agenda", roles: ["admin", "comercial", "financeiro", "artista"] },
    { to: "/app/leads", icon: Handshake, label: "Leads", roles: ["admin", "comercial", "financeiro"] },
    { to: "/app/contracts", icon: FileText, label: "Contratos", roles: ["admin", "comercial", "financeiro"] },
    { to: "/app/contacts", icon: Users, label: "Contatos", roles: ["admin", "comercial", "financeiro"] },
    { to: "/app/tasks", icon: ListChecks, label: "Tarefas", roles: ["admin", "comercial", "financeiro", "artista"] },
    { to: "/app/team", icon: UsersRound, label: "Equipe", roles: ["admin"] },
    { to: "/app/users", icon: UserCog, label: "Usuários", roles: ["admin"] },
    { to: "/app/map", icon: Map, label: "Mapa", roles: ["admin", "comercial", "financeiro"] },
    { to: "/app/financial", icon: DollarSign, label: "Financeiro", roles: ["admin", "financeiro"] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              RL
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight flex items-center gap-2">
                CRM Rodrigo Lopes
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {roleLabel}
                </Badge>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {profile?.display_name ?? profile?.email ?? user?.email ?? ""}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <TopNavItem key={item.to} {...item} />
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <GlobalSearch />
            {canManageLeads && <QuickAddMenu />}
            <NotificationBell />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background p-4 animate-fade-in">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <TopNavItem
                  key={item.to}
                  {...item}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 mt-2 justify-start"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
