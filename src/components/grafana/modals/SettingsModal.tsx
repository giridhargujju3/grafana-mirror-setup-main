import { X, Save } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = ["General", "Annotations", "Variables", "Links", "JSON Model"];

export function SettingsModal() {
  const { showSettingsModal, setShowSettingsModal, dashboardTitle, setDashboardTitle } = useDashboard();
  const [activeTab, setActiveTab] = useState("General");
  const [localTitle, setLocalTitle] = useState(dashboardTitle);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>(["production", "monitoring"]);
  const [folder, setFolder] = useState("General");
  const [editable, setEditable] = useState(true);

  if (!showSettingsModal) return null;

  const handleSave = () => {
    setDashboardTitle(localTitle);
    toast.success("Dashboard settings saved!");
    setShowSettingsModal(false);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      setTags([...tags, e.currentTarget.value.trim()]);
      e.currentTarget.value = "";
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowSettingsModal(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-lg shadow-2xl animate-fade-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Dashboard Settings</h2>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "General" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  className="w-full grafana-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dashboard description..."
                  className="w-full h-20 grafana-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary-foreground"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tag and press Enter..."
                  onKeyDown={handleAddTag}
                  className="w-full grafana-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Folder
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full grafana-input"
                >
                  <option>General</option>
                  <option>Infrastructure</option>
                  <option>Applications</option>
                  <option>Business</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editable"
                  checked={editable}
                  onChange={(e) => setEditable(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="editable" className="text-sm text-foreground">
                  Editable
                </label>
              </div>
            </div>
          )}

          {activeTab === "Annotations" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Annotations provide a way to mark points on the graph with rich events. When you hover over an annotation, you can get event description and tags.
              </p>
              <button className="grafana-btn grafana-btn-secondary">
                Add annotation query
              </button>
            </div>
          )}

          {activeTab === "Variables" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Variables enable more interactive and dynamic dashboards. Instead of hard-coding things like server, application, and sensor names, you can use variables in their place.
              </p>
              <button className="grafana-btn grafana-btn-secondary">
                Add variable
              </button>
            </div>
          )}

          {activeTab === "Links" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dashboard links allow you to place links to other dashboards and websites directly below the dashboard header.
              </p>
              <button className="grafana-btn grafana-btn-secondary">
                Add dashboard link
              </button>
            </div>
          )}

          {activeTab === "JSON Model" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The JSON model below is the data structure that defines the dashboard. This includes dashboard settings, panel settings, layout, queries, and so on.
              </p>
              <textarea
                readOnly
                value={JSON.stringify({ title: localTitle, tags, folder, editable }, null, 2)}
                className="w-full h-64 grafana-input font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="grafana-btn grafana-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="grafana-btn grafana-btn-primary"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
