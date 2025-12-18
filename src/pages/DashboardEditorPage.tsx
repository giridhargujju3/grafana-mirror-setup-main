import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDashboardRegistry, DashboardEntry } from "@/contexts/DashboardRegistryContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { DashboardContent } from "@/components/grafana/GrafanaDashboard";
import { UnsavedChangesModal } from "@/components/grafana/modals/UnsavedChangesModal";

export default function DashboardEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dashboardId } = useParams();
  const {
    createNewDashboard,
    openDashboard,
    getDashboard,
    hasUnsavedDraft,
    getUnsavedDraft,
    saveDashboard,
    discardDashboard,
  } = useDashboardRegistry();

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardEntry | null>(null);
  const [savedDashboard, setSavedDashboard] = useState<any>(null);

  useEffect(() => {
    if (dashboardId) {
      // Check if dashboard data is passed via navigation state
      if (location.state?.dashboardData) {
        setSavedDashboard(location.state.dashboardData);
        setCurrentDashboard(null);
        return;
      }
      
      // 1. Try to load from localStorage FIRST (Persistence)
      const savedDashboards = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
      const foundInStorage = savedDashboards.find((d: any) => d.id === dashboardId || d.uid === dashboardId);
      
      if (foundInStorage) {
        setSavedDashboard(foundInStorage);
        setCurrentDashboard(null);
        return;
      }

      // 2. If not in localStorage, check registry (Session/Drafts)
      const dashboard = getDashboard(dashboardId);
      if (dashboard) {
        openDashboard(dashboardId);
        setCurrentDashboard(dashboard);
        setSavedDashboard(null);
      } else {
        // Dashboard not found anywhere, redirect to dashboards list
        navigate("/dashboards");
      }
    } else {
      // Creating new dashboard OR opening existing draft
      // Check if there's already an unsaved draft
      if (hasUnsavedDraft()) {
        const draft = getUnsavedDraft();
        if (draft) {
          // Reuse existing draft instead of creating duplicate
          openDashboard(draft.id);
          setCurrentDashboard(draft);
          navigate(`/dashboard/${draft.id}`, { replace: true });
        }
      } else {
        // Create new dashboard
        const newId = createNewDashboard();
        const newDashboard = getDashboard(newId);
        if (newDashboard) {
          setCurrentDashboard(newDashboard);
        }
        navigate(`/dashboard/${newId}`, { replace: true });
      }
    }
  }, [dashboardId]);

  // Update current dashboard when it changes in registry
  useEffect(() => {
    if (dashboardId) {
      const dashboard = getDashboard(dashboardId);
      if (dashboard) {
        setCurrentDashboard(dashboard);
      }
    }
  }, [dashboardId, getDashboard]);

  const handleSave = () => {
    if (currentDashboard) {
      saveDashboard(currentDashboard.id);
      setShowUnsavedModal(false);
    }
  };

  const handleDiscard = () => {
    if (currentDashboard) {
      discardDashboard(currentDashboard.id);
      setShowUnsavedModal(false);
      navigate("/dashboards");
    }
  };

  if (!currentDashboard && !savedDashboard) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }
  
  // Use saved dashboard data if available, otherwise use registry dashboard
  const dashboardData = savedDashboard || currentDashboard;

  return (
    <DashboardProvider
      key={dashboardData.id}
      initialTitle={dashboardData.title}
      initialFolder={dashboardData.folder}
      initialTags={dashboardData.tags || []}
      initialPanels={dashboardData.panels || []}
      isNewDashboard={dashboardData.isNew || false}
      dashboardId={dashboardData.id}
    >
      <DashboardContent />
      {currentDashboard && (
        <UnsavedChangesModal
          open={showUnsavedModal}
          onClose={() => setShowUnsavedModal(false)}
          onDiscard={handleDiscard}
          onSave={handleSave}
          dashboardTitle={currentDashboard.title}
          isNew={currentDashboard.isNew}
        />
      )}
    </DashboardProvider>
  );
}
