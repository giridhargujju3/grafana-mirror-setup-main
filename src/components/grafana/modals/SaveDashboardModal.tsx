import { useState } from "react";
import { X, Folder, Tag, Save, AlertTriangle } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const folders = [
  { id: "general", name: "General" },
  { id: "monitoring", name: "Monitoring" },
  { id: "application", name: "Application" },
  { id: "infrastructure", name: "Infrastructure" },
  { id: "business", name: "Business" },
];

export function SaveDashboardModal() {
  const { 
    showSaveDashboardModal, 
    setShowSaveDashboardModal,
    dashboardTitle,
    setDashboardTitle,
    dashboardFolder,
    setDashboardFolder,
    dashboardTags,
    setDashboardTags,
    dashboardState,
    saveDashboard,
    setIsEditMode,
    panels, // Add panels to get current panels
  } = useDashboard();
  
  const [title, setTitle] = useState(dashboardTitle);
  const [folder, setFolder] = useState(dashboardFolder);
  const [tagsInput, setTagsInput] = useState(dashboardTags.join(", "));
  const [saveMessage, setSaveMessage] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  if (!showSaveDashboardModal) return null;

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Dashboard title is required");
      return;
    }

    console.log('SaveDashboardModal - handleSave called. Current state:', {
      title,
      folder,
      dashboardStateIsNew: dashboardState.isNew,
      currentPanelsCount: panels.length
    });
    
    console.log('Current panels in SaveDashboardModal:', panels);

    setDashboardTitle(title);
    setDashboardFolder(folder);
    setDashboardTags(tagsInput.split(",").map(t => t.trim()).filter(Boolean));
    
    console.log('Calling saveDashboard with:', { title, folder, panelsCount: panels.length });
    saveDashboard({
      title,
      folder,
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean)
    });
    
    toast.success(`Dashboard "${title}" saved successfully`);
    setShowSaveDashboardModal(false);
    
    // Trigger a storage event to refresh other components
    window.dispatchEvent(new Event('storage'));
    
    // Exit edit mode after saving
    setIsEditMode(false);
  };

  const handleSaveAs = () => {
    if (!title.trim()) {
      toast.error("Dashboard title is required");
      return;
    }

    // Create a copy with new title
    setDashboardTitle(title + " (copy)");
    setDashboardFolder(folder);
    setDashboardTags(tagsInput.split(",").map(t => t.trim()).filter(Boolean));
    saveDashboard({
      title: title + " (copy)",
      folder,
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean)
    });
    
    toast.success(`Dashboard saved as "${title} (copy)"`);
    setShowSaveDashboardModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowSaveDashboardModal(false)}
      />
      
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Save dashboard</h2>
          <button
            onClick={() => setShowSaveDashboardModal(false)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {dashboardState.isNew && (
            <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <AlertTriangle size={18} className="text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">This is a new dashboard</p>
                <p className="text-muted-foreground">It hasn't been saved yet. Give it a name and folder.</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dashboard name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter dashboard name"
              autoFocus
            />
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Folder size={14} />
              Folder
            </label>
            {showNewFolderInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="New folder name"
                />
                <button 
                  onClick={() => {
                    if (newFolderName.trim()) {
                      setFolder(newFolderName);
                      setShowNewFolderInput(false);
                    }
                  }}
                  className="grafana-btn grafana-btn-primary"
                >
                  Add
                </button>
                <button 
                  onClick={() => setShowNewFolderInput(false)}
                  className="grafana-btn grafana-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowNewFolderInput(true)}
                  className="grafana-btn grafana-btn-secondary"
                >
                  New
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Tag size={14} />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="monitoring, production, system"
            />
            {tagsInput && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagsInput.split(",").map((tag, i) => tag.trim() && (
                  <span key={i} className="px-2 py-0.5 bg-secondary text-xs rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Save message (optional)</label>
            <textarea
              value={saveMessage}
              onChange={(e) => setSaveMessage(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Describe your changes..."
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
          <button
            onClick={() => setShowSaveDashboardModal(false)}
            className="grafana-btn grafana-btn-secondary"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {!dashboardState.isNew && (
              <button onClick={handleSaveAs} className="grafana-btn grafana-btn-secondary">
                Save as copy
              </button>
            )}
            <button onClick={handleSave} className="grafana-btn grafana-btn-primary">
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}