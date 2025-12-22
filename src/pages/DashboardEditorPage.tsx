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
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (dashboardId) {
      // Check if dashboard data is passed via navigation state
      if (location.state?.dashboardData) {
        const dashData = location.state.dashboardData;
        console.log('Loading dashboard from state:', dashData.id, 'panels:', dashData.panels?.length);
        setSavedDashboard(dashData);
        setCurrentDashboard(null);
        setEditMode(location.state.editMode || false);
        return;
      }
      
      // 1. Try to load from localStorage FIRST (Persistence)
      const savedDashboards = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
      const foundInStorage = savedDashboards.find((d: any) => d.id === dashboardId || d.uid === dashboardId);
      
      if (foundInStorage) {
        console.log('Loading dashboard from localStorage:', foundInStorage.id, 'panels:', foundInStorage.panels?.length || 0);
        console.log('Dashboard data:', foundInStorage);
        
        // Debug: Check if panels exist and are valid
        if (!foundInStorage.panels || !Array.isArray(foundInStorage.panels)) {
          console.warn('Dashboard has no panels or invalid panels array, initializing with empty array');
          foundInStorage.panels = [];
        }
        
        console.log('Final panels to load:', foundInStorage.panels);
        console.log('Setting savedDashboard with panels:', foundInStorage.panels?.length);
        setSavedDashboard({...foundInStorage}); // Create a new object to trigger re-render
        setCurrentDashboard(null);
        setEditMode(false); // Always start in view mode for saved dashboards
        return;
      }

      // 2. If not in localStorage, check registry (Session/Drafts)
      const dashboard = getDashboard(dashboardId);
      if (dashboard) {
        openDashboard(dashboardId);
        setCurrentDashboard(dashboard);
        setSavedDashboard(null);
        // New/unsaved dashboards should start in edit mode
        setEditMode(dashboard.isNew || false);
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
          setEditMode(true);
          navigate(`/dashboard/${draft.id}`, { replace: true });
        }
      } else {
        // Create new dashboard
        const newId = createNewDashboard();
        const newDashboard = getDashboard(newId);
        if (newDashboard) {
          setCurrentDashboard(newDashboard);
          setEditMode(true);
        }
        navigate(`/dashboard/${newId}`, { replace: true });
      }
    }
  }, [dashboardId, location, navigate, createNewDashboard, openDashboard, getDashboard, hasUnsavedDraft, getUnsavedDraft]);

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
  
  console.log('DashboardEditorPage - Rendering with dashboardData:', {
    id: dashboardData?.id,
    title: dashboardData?.title,
    panelsCount: dashboardData?.panels?.length || 0,
    panels: dashboardData?.panels
  });

  return (
    <DashboardProvider
      key={`${dashboardData.id}-${dashboardData.panels?.length || 0}`} // Force re-render when panels change
      initialTitle={dashboardData.title}
      initialFolder={dashboardData.folder}
      initialTags={dashboardData.tags || []}
      initialPanels={dashboardData.panels || []} // Ensure panels is always an array
      isNewDashboard={dashboardData.isNew || false}
      dashboardId={dashboardData.id}
      initialEditMode={editMode}
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
