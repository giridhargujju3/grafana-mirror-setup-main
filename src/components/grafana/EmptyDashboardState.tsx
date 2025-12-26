import { Plus, Upload, Link2, Database, X } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function EmptyDashboardState() {
  const { setShowDataSourceSelector, setShowCSVImportModal, setPanels, setDashboardTitle } = useDashboard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportLinkModal, setShowImportLinkModal] = useState(false);
  const [dashboardLink, setDashboardLink] = useState("");

  const handleAddVisualization = () => {
    // Show data source selector first, which will then open panel editor
    setShowDataSourceSelector(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const dashboard = JSON.parse(content);
        
        if (dashboard.panels && Array.isArray(dashboard.panels)) {
           setPanels(dashboard.panels);
           if (dashboard.title) {
             setDashboardTitle(dashboard.title);
           }
           toast.success("Dashboard imported successfully");
        } else {
           toast.error("Invalid dashboard JSON: missing panels array");
        }
      } catch (error) {
        console.error("Error parsing JSON", error);
        toast.error("Failed to parse dashboard JSON");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleImportFromLink = () => {
    if (!dashboardLink.trim()) {
      toast.error("Please enter a valid dashboard link");
      return;
    }

    try {
      // Extract base64 data from URL
      const url = new URL(dashboardLink);
      const base64Data = url.searchParams.get('data');
      
      if (!base64Data) {
        toast.error("Invalid share link format");
        return;
      }

      // Decode base64 to JSON
      const jsonString = decodeURIComponent(escape(atob(base64Data)));
      const dashboard = JSON.parse(jsonString);

      if (dashboard.panels && Array.isArray(dashboard.panels)) {
        setPanels(dashboard.panels);
        if (dashboard.title) {
          setDashboardTitle(dashboard.title);
        }
        toast.success("Dashboard imported successfully from link!");
        setShowImportLinkModal(false);
        setDashboardLink("");
      } else {
        toast.error("Invalid dashboard data: missing panels");
      }
    } catch (error) {
      console.error("Error importing from link", error);
      toast.error("Failed to import dashboard from link");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
        style={{ display: 'none' }}
      />
      <div className="max-w-2xl w-full">
        {/* Main Add Visualization Card */}
        <div className="border border-dashed border-border rounded-lg p-6 md:p-12 text-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
            Start your new dashboard by adding a visualization
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-sm md:text-base">
            Select a data source and then query and visualize your data with charts, stats and tables or create lists, markdowns and other widgets.
          </p>
          <button
            onClick={handleAddVisualization}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Add visualization
          </button>
        </div>

        {/* Secondary Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CSV Import Card */}
          <div className="border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Import CSV data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload CSV files or paste data to create visualizations.
            </p>
            <button 
              onClick={() => setShowCSVImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Database size={16} />
              Import CSV
            </button>
          </div>
          {/* Import Dashboard Link Card */}
          <div className="border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Import dashboard link</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Paste a dashboard share link to import panels and configuration.
            </p>
            <button 
              onClick={() => setShowImportLinkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Link2 size={16} />
              Import from link
            </button>
          </div>

          {/* Import Dashboard Card */}
          <div className="border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Import a dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import dashboards from files or <span className="text-primary">grafana.com</span>.
            </p>
            <button 
              onClick={handleImportClick}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Upload size={16} />
              Import JSON
            </button>
          </div>
        </div>
      </div>

      {/* Import Dashboard Link Modal */}
      {showImportLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowImportLinkModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Import Dashboard from Link</h3>
              <button
                onClick={() => setShowImportLinkModal(false)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dashboard Share Link
                </label>
                <input
                  type="text"
                  value={dashboardLink}
                  onChange={(e) => setDashboardLink(e.target.value)}
                  placeholder="Paste dashboard share link here..."
                  className="w-full grafana-input"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Paste the link generated from Dashboard Settings → Links
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
              <button
                onClick={() => setShowImportLinkModal(false)}
                className="grafana-btn grafana-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleImportFromLink}
                className="grafana-btn grafana-btn-primary"
              >
                <Link2 size={16} />
                Import Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
