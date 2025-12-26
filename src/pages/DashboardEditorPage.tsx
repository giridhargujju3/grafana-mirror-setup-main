import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDashboardRegistry, DashboardEntry } from "@/contexts/DashboardRegistryContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { DashboardContent } from "@/components/grafana/GrafanaDashboard";
import { UnsavedChangesModal } from "@/components/grafana/modals/UnsavedChangesModal";
import { API_BASE_URL } from "@/lib/api";

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
      let savedDashboards = [];
      try {
        savedDashboards = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
      } catch (e) {
        console.error('Failed to parse localStorage dashboards:', e);
        savedDashboards = [];
      }

      // Use loose comparison or string conversion to handle number/string ID mismatches
      const foundInStorage = savedDashboards.find((d: any) => 
        String(d.id) === String(dashboardId) || String(d.uid) === String(dashboardId)
      );
      
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
        return;
      } 
      
      // 3. Fallback: Check backend API (in case sidebar misrouted or it's a backend dashboard)
      // We fetch the list because we need to match by ID or UID, and /uid endpoint requires UID
      fetch(`${API_BASE_URL}/dashboards`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const foundBackend = data.find((d: any) => 
              String(d.id) === String(dashboardId) || String(d.uid) === String(dashboardId)
            );
            
            if (foundBackend) {
              console.log('Found dashboard in backend fallback:', foundBackend);
              // Backend dashboards might need panels fetched separately if list doesn't have them
              // But for now let's assume list has them or we load what we have
              // If backend dashboard viewing requires specific viewer, we might need to redirect
              // But if we are here, we try to render it.
              setSavedDashboard(foundBackend);
              setCurrentDashboard(null);
              setEditMode(false);
              return;
            }
          }
          // If still not found, redirect
          console.warn('Dashboard not found anywhere, redirecting');
          navigate("/dashboards");
        })
        .catch(err => {
          console.error('Failed to fetch from backend fallback:', err);
          navigate("/dashboards");
        });

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

  const handleBackendSave = async (dashboardData: any) => {
    try {
      // Check if this dashboard should be saved to backend
      // We'll save to backend if it was originally from backend OR if we want to persist all saves
      const apiKey = localStorage.getItem('grafana_api_key') || "gm_61f62cdbcbbe14d4bb4eb3631cf6a49a4a73ee138b899796a32ac387fab76242";
      
      const response = await fetch(`${API_BASE_URL}/dashboards/db`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          dashboard: {
            ...dashboardData,
            overwrite: true
          },
          overwrite: true
        })
      });

      if (response.ok) {
        console.log('Dashboard also persisted to backend JSON');
      }
    } catch (error) {
      console.error('Failed to sync to backend:', error);
    }
  };

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
      onSave={handleBackendSave}
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
