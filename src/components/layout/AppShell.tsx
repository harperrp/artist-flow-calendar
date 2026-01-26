import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
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
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/app/calendar", icon: CalendarDays, label: "Agenda" },
    { to: "/app/leads", icon: Handshake, label: "Leads" },
    { to: "/app/contracts", icon: FileText, label: "Contratos" },
    { to: "/app/contacts", icon: Users, label: "Contatos" },
    { to: "/app/map", icon: Map, label: "Mapa" },
    { to: "/app/financial", icon: DollarSign, label: "Financeiro" },
  ];

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
              <div className="text-sm font-semibold tracking-tight">CRM Rodrigo Lopes</div>
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
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 hidden sm:flex"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair
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
