import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDashboardRegistry, DashboardEntry } from "@/contexts/DashboardRegistryContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { DashboardContent } from "@/components/grafana/GrafanaDashboard";
import { UnsavedChangesModal } from "@/components/grafana/modals/UnsavedChangesModal";

export default function DashboardEditorPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    if (dashboardId) {
      // Opening an existing dashboard by ID
      const dashboard = getDashboard(dashboardId);
      if (dashboard) {
        openDashboard(dashboardId);
        setCurrentDashboard(dashboard);
      } else {
        // Dashboard not found, redirect to dashboards list
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

  if (!currentDashboard) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardProvider
      key={currentDashboard.id}
      initialTitle={currentDashboard.title}
      initialFolder={currentDashboard.folder}
      initialTags={currentDashboard.tags}
      initialPanels={currentDashboard.panels}
      isNewDashboard={currentDashboard.isNew}
      dashboardId={currentDashboard.id}
    >
      <DashboardContent />
      <UnsavedChangesModal
        open={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onDiscard={handleDiscard}
        onSave={handleSave}
        dashboardTitle={currentDashboard.title}
        isNew={currentDashboard.isNew}
      />
    </DashboardProvider>
  );
}
