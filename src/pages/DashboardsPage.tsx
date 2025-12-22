import { useState, useEffect } from "react";
import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { SearchModal } from "@/components/grafana/modals/SearchModal";
import { FolderModal } from "@/components/grafana/modals/FolderModal";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useDashboardRegistry } from "@/contexts/DashboardRegistryContext";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, FolderPlus, FileUp, Clock, Star, Trash2, Folder } from "lucide-react";

function DashboardsContent() {
  const navigate = useNavigate();
  const { dashboards, createNewDashboard, deleteDashboard } = useDashboardRegistry();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [savedDashboards, setSavedDashboards] = useState<any[]>([]);

  useEffect(() => {
    const loadSavedDashboards = () => {
      const saved = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
      setSavedDashboards(saved);
    };
    
    loadSavedDashboards();
    
    // Listen for storage changes to refresh the list
    const handleStorageChange = () => {
      loadSavedDashboards();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const starredDashboards = dashboards.filter(d => d.starred && !d.isNew);
  const recentDashboards = [...dashboards.filter(d => !d.isNew), ...savedDashboards]
    .sort((a, b) => new Date(b.updatedAt || b.savedAt).getTime() - new Date(a.updatedAt || a.savedAt).getTime());
  const draftDashboards = dashboards.filter(d => d.isNew);
  
  // Group dashboards by folder
  const dashboardsByFolder = recentDashboards.reduce((acc, dashboard) => {
    const folder = dashboard.folder || 'General';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(dashboard);
    return acc;
  }, {} as Record<string, any[]>);

  const handleNewDashboard = () => {
    const newId = createNewDashboard();
    navigate(`/dashboard/${newId}`);
  };

  const handleOpenDashboard = (dashboard: any) => {
    if (dashboard.id) {
      // For saved dashboards, navigate with the dashboard data in view mode (not edit)
      navigate(`/dashboard/${dashboard.id}`, { state: { dashboardData: dashboard, editMode: false } });
    } else {
      // For registry dashboards
      navigate(`/dashboard/${dashboard.id || dashboard.uid}`);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">Dashboards</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewDashboard}
              className="grafana-btn grafana-btn-primary"
            >
              <Plus size={16} />
              New Dashboard
            </button>
            <button 
              onClick={() => setShowFolderModal(true)}
              className="grafana-btn grafana-btn-secondary"
            >
              <FolderPlus size={16} />
              New Folder
            </button>
            <button className="grafana-btn grafana-btn-secondary">
              <FileUp size={16} />
              Import
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Draft/Unsaved Dashboards */}
          {draftDashboards.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-medium text-foreground mb-4">
                <LayoutDashboard size={20} className="text-grafana-orange" />
                Unsaved dashboards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {draftDashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    className="flex items-center gap-3 p-4 bg-card border border-grafana-orange/50 rounded-lg hover:border-grafana-orange transition-colors"
                  >
                    <button
                      onClick={() => handleOpenDashboard(dashboard)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="p-2 bg-grafana-orange/20 rounded">
                        <LayoutDashboard size={20} className="text-grafana-orange" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{dashboard.title}</div>
                        <div className="text-xs text-grafana-orange">Unsaved draft</div>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteDashboard(dashboard.id)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title="Discard draft"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Starred Section */}
          {starredDashboards.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-medium text-foreground mb-4">
                <Star size={20} className="text-grafana-yellow" />
                Starred dashboards
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {starredDashboards.map((dashboard) => (
                  <button
                    key={dashboard.id}
                    onClick={() => handleOpenDashboard(dashboard)}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <div className="p-2 bg-grafana-yellow/20 rounded">
                      <LayoutDashboard size={20} className="text-grafana-yellow" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{dashboard.title}</div>
                      <div className="text-sm text-muted-foreground">{dashboard.folder}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Folders Section */}
          {Object.keys(dashboardsByFolder).map(folderName => (
            <section key={folderName} className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-medium text-foreground mb-4">
                <Clock size={20} className="text-muted-foreground" />
                {folderName} ({dashboardsByFolder[folderName].length})
              </h2>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Last updated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboardsByFolder[folderName].map((dashboard) => (
                      <tr
                        key={dashboard.id || dashboard.uid}
                        onClick={() => handleOpenDashboard(dashboard)}
                        className="hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <LayoutDashboard size={18} className="text-muted-foreground" />
                            <span className="font-medium text-foreground">{dashboard.title}</span>
                            {dashboard.isDirty && (
                              <span className="text-xs text-grafana-orange">*unsaved</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {dashboard.updatedAt ? 
                            new Date(dashboard.updatedAt).toLocaleDateString() : 
                            new Date(dashboard.savedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {(dashboard.tags || []).map(tag => (
                              <span key={tag} className="px-2 py-0.5 text-xs bg-secondary rounded text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          
          {Object.keys(dashboardsByFolder).length === 0 && (
            <section>
              <div className="text-center py-12">
                <LayoutDashboard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No dashboards yet</h3>
                <p className="text-muted-foreground mb-4">Create your first dashboard to get started</p>
                <button onClick={handleNewDashboard} className="grafana-btn grafana-btn-primary">
                  <Plus size={16} />
                  Create Dashboard
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
      <SearchModal />
      <FolderModal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} />
    </div>
  );
}

export default function DashboardsPage() {
  return (
    <DashboardProvider>
      <DashboardsContent />
    </DashboardProvider>
  );
}
