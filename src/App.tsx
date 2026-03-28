import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { OrgProvider } from "@/providers/OrgProvider";
import { AppShell } from "@/components/layout/AppShell";
import { LeadsPage } from "@/pages/Leads";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WhatsAppInboxPage } from "@/pages/WhatsAppInbox";


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
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />

              {/* Protected App Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="artist" element={<ArtistDashboardPage />} />
                  <Route path="calendar" element={<ArtistCalendarPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="whatsapp" element={<WhatsAppInboxPage />} />
                  <Route path="contracts" element={<ContractsCrudPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="map" element={<MapViewPage />} />
                  <Route path="financial" element={<FinancialPage />} />
                  <Route path="admin" element={<SuperAdminPage />} />
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
