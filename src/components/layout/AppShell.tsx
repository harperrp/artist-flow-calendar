import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useOrg } from "@/providers/OrgProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  Handshake,
  LogOut,
  MessageCircle,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { to: "/app/leads", icon: Handshake, label: "Leads" },
  { to: "/app/inbox", icon: MessageCircle, label: "Inbox" },
];

export function AppShell() {
  const { user } = useAuth();
  const { profile } = useOrg();
  const { roleLabel } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-all duration-200 lg:relative",
          sidebarOpen ? "w-56" : "w-0 lg:w-14",
          !sidebarOpen && "overflow-hidden lg:overflow-visible"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            RL
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">CRM</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {profile?.display_name ?? user?.email ?? ""}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-2 space-y-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4 lg:hidden" /> : <Menu className="h-4 w-4" />}
            <Menu className="h-4 w-4 hidden lg:block" />
          </Button>
          <Badge variant="outline" className="text-[10px]">{roleLabel}</Badge>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}