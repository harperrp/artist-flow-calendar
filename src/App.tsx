import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider } from "@/providers/AuthProvider";
import { OrgProvider } from "@/providers/OrgProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/Dashboard";
import { LeadsKanbanPage } from "@/pages/LeadsKanban";
import { ContractsCrudPage } from "@/pages/ContractsCrud";
import { MapViewPage } from "@/pages/MapView";
import { FinancialPage } from "@/pages/Financial";
import { ContactsPage } from "@/pages/Contacts";
import { ArtistCalendarPage } from "@/components/artist-calendar/ArtistCalendarPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <OrgProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="calendar" element={<ArtistCalendarPage />} />
                  <Route path="leads" element={<LeadsKanbanPage />} />
                  <Route path="contracts" element={<ContractsCrudPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="map" element={<MapViewPage />} />
                  <Route path="financial" element={<FinancialPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OrgProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
