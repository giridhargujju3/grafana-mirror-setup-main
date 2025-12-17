import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardRegistryProvider } from "./contexts/DashboardRegistryContext";
import Index from "./pages/Index";
import DashboardsPage from "./pages/DashboardsPage";
import ExplorePage from "./pages/ExplorePage";
import AlertingPage from "./pages/AlertingPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import DashboardEditorPage from "./pages/DashboardEditorPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DashboardRegistryProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboards" element={<DashboardsPage />} />
            <Route path="/dashboards/new" element={<DashboardEditorPage />} />
            <Route path="/dashboard/:dashboardId" element={<DashboardEditorPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/alerting/*" element={<AlertingPage />} />
            <Route path="/connections/*" element={<ConnectionsPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DashboardRegistryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
