import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { SearchModal } from '@/components/grafana/modals/SearchModal';
import { DashboardContent } from '@/components/grafana/GrafanaDashboard';
import { UnsavedChangesModal } from '@/components/grafana/modals/UnsavedChangesModal';
import { SaveDashboardModal } from '@/components/grafana/modals/SaveDashboardModal';
import { toast } from 'sonner';
import { API_BASE_URL, API_KEY } from '@/lib/api';

function BackendDashboardContent({ onReady }: { onReady: (saveHandler: any) => void }) {
  const { uid } = useParams();
  const { 
    setPanels, 
    setDashboardTitle, 
    setDashboardFolder,
    setDashboardTags,
    saveDashboard, 
    dashboardState,
    setShowSaveDashboardModal,
    showSaveDashboardModal,
    setIsEditMode,
    isEditMode,
    panels
  } = useDashboard();
  
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define handleSaveToBackend first so it can be passed to onReady
  const handleSaveToBackend = async (saveOptions: any) => {
    try {
      const isFullData = saveOptions && saveOptions.panels;
      
      const dashboardToSave = {
        ...(dashboard?.dashboard || {}),
        title: saveOptions.title,
        folderTitle: isFullData ? (saveOptions.folder || 'General') : (saveOptions.folder || 'General'),
        tags: isFullData ? (saveOptions.tags || []) : (saveOptions.tags || []),
        panels: isFullData ? saveOptions.panels : panels,
        uid: uid,
        overwrite: true
      };

      const apiKey = API_KEY;

      const response = await fetch(`${API_BASE_URL}/dashboards/db`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          dashboard: dashboardToSave,
          folderId: 0,
          overwrite: true
        })
      });

      if (response.ok) {
        toast.success('Dashboard saved to backend');
        setIsEditMode(false);
        
        setDashboard(prev => ({
          ...prev,
          dashboard: dashboardToSave
        }));
      } else {
        const err = await response.json();
        toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to save dashboard');
      console.error(error);
    }
  };

  // Pass the save handler up to the provider
  useEffect(() => {
    if (!loading && dashboard) {
      onReady(handleSaveToBackend);
    }
  }, [loading, dashboard, panels]);

  // Load dashboard
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboards/uid/${uid}`);
        if (response.ok) {
          const data = await response.json();
          setDashboard(data);
          
          if (data.dashboard) {
            setDashboardTitle(data.dashboard.title || 'Dashboard');
            setDashboardFolder(data.dashboard.folderTitle || 'General');
            setDashboardTags(data.dashboard.tags || []);
            
            if (data.dashboard.panels) {
              const enrichedPanels = await Promise.all(data.dashboard.panels.map(async (panel: any) => {
                try {
                  if (panel.targets && panel.targets.length > 0) {
                    const queryResponse = await fetch(`${API_BASE_URL}/query`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        queries: panel.targets.map((target: any) => ({
                          ...target,
                          datasource: panel.datasource?.uid || 'ds-1766647484377'
                        }))
                      })
                    });
                    
                    if (queryResponse.ok) {
                      const queryData = await queryResponse.json();
                      const result = queryData.data?.[0];
                      if (result && result.fields) {
                        const columns = result.fields.map((f: any) => f.name);
                        const rowCount = result.length;
                        const rows = [];
                        for (let i = 0; i < rowCount; i++) {
                          rows.push(result.fields.map((f: any) => f.values[i]));
                        }
                        return { ...panel, options: { ...panel.options, queryResult: { columns, rows, rowCount } } };
                      }
                    }
                  }
                  return panel;
                } catch (err) {
                  return panel;
                }
              }));
              setPanels(enrichedPanels);
            }
          }
        } else {
          setError('Dashboard not found');
        }
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      loadDashboard();
    }
  }, [uid]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-center">
        <div>
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.history.back()} className="grafana-btn grafana-btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardContent />
      <SearchModal />
      <CustomSaveDashboardModal onSave={handleSaveToBackend} />
    </>
  );
}

function CustomSaveDashboardModal({ onSave }: { onSave: (opts: any) => void }) {
  const { showSaveDashboardModal, setShowSaveDashboardModal, dashboardTitle, dashboardFolder, dashboardTags, setDashboardTitle, setDashboardFolder } = useDashboard();
  const [title, setTitle] = useState(dashboardTitle);
  const [folder, setFolder] = useState(dashboardFolder);
  
  useEffect(() => {
    if (showSaveDashboardModal) {
      setTitle(dashboardTitle);
      setFolder(dashboardFolder);
    }
  }, [showSaveDashboardModal, dashboardTitle, dashboardFolder]);

  if (!showSaveDashboardModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowSaveDashboardModal(false)} />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold">Save dashboard</h2>
          <button onClick={() => setShowSaveDashboardModal(false)} className="p-1 hover:bg-secondary rounded">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dashboard name</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setShowSaveDashboardModal(false)} className="grafana-btn grafana-btn-secondary">Cancel</button>
            <button onClick={() => {
              onSave({ title, folder, tags: dashboardTags });
              setDashboardTitle(title);
              setDashboardFolder(folder);
              setShowSaveDashboardModal(false);
            }} className="grafana-btn grafana-btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BackendDashboardViewer() {
  const { uid } = useParams();
  const saveHandlerRef = useRef<any>(null);

  const handleSaveProxy = async (data: any) => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current(data);
    }
  };

  return (
    <DashboardProvider dashboardId={uid} onSave={handleSaveProxy}>
      <BackendDashboardContent onReady={(handler) => { saveHandlerRef.current = handler; }} />
    </DashboardProvider>
  );
}
