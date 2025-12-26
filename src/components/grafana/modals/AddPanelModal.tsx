import { X, LineChart, BarChart3, Gauge, Table2, PieChart, MapPin, Text, AlertCircle, FileText, Grid3x3, Activity, GitBranch } from "lucide-react";
import { useDashboard, PanelConfig } from "@/contexts/DashboardContext";
import { toast } from "sonner";

const panelTypes = [
  { icon: LineChart, name: "Time series", type: "timeseries", description: "Graph time series data", category: "Graph" },
  { icon: BarChart3, name: "Bar chart", type: "barchart", description: "Categorical bar chart", category: "Graph" },
  { icon: Text, name: "Stat", type: "stat", description: "Big number with sparkline", category: "Stats" },
  { icon: Gauge, name: "Gauge", type: "gauge", description: "Single value gauge", category: "Stats" },
  { icon: Table2, name: "Table", type: "table", description: "Display data as table", category: "Table" },
  { icon: Grid3x3, name: "Heatmap", type: "heatmap", description: "Data density visualization", category: "Graph" },
  { icon: Activity, name: "Status history", type: "statushistory", description: "Discrete status over time", category: "Graph" },
  { icon: GitBranch, name: "State timeline", type: "statetimeline", description: "State changes timeline", category: "Graph" },
  { icon: PieChart, name: "Pie chart", type: "piechart", description: "Proportional data", category: "Graph" },
  { icon: AlertCircle, name: "Alert list", type: "alertlist", description: "Show alert states", category: "List" },
  { icon: FileText, name: "Logs", type: "logs", description: "Display log entries", category: "List" },
];

export function AddPanelModal() {
  const { 
    showAddPanelModal, 
    setShowAddPanelModal, 
    addPanel, 
    panels,
    setShowPanelEditor,
    setEditingPanel 
  } = useDashboard();

  if (!showAddPanelModal) return null;

  const handleAddPanel = (panelType: typeof panelTypes[0]) => {
    // Calculate position for new panel
    const maxY = panels.reduce((max, p) => Math.max(max, p.gridPos.y + p.gridPos.h), 0);
    
    const newPanel: PanelConfig = {
      id: `panel-${Date.now()}`,
      type: panelType.type as PanelConfig["type"],
      title: `New ${panelType.name}`,
      gridPos: { x: 0, y: maxY, w: 6, h: 4 },
      options: {},
      targets: [{ refId: "A", expr: "", datasource: "prometheus" }],
    };
    
    addPanel(newPanel);
    toast.success(`Added ${panelType.name} panel`);
    setShowAddPanelModal(false);
    
    // Open panel editor for the new panel
    setEditingPanel(newPanel);
    setShowPanelEditor(true);
  };

  const handleAddEmptyPanel = () => {
    const maxY = panels.reduce((max, p) => Math.max(max, p.gridPos.y + p.gridPos.h), 0);
    
    const newPanel: PanelConfig = {
      id: `panel-${Date.now()}`,
      type: "timeseries",
      title: "New Panel",
      gridPos: { x: 0, y: maxY, w: 6, h: 4 },
      options: {},
      targets: [{ refId: "A", expr: "", datasource: "prometheus" }],
    };
    
    setShowAddPanelModal(false);
    setEditingPanel(newPanel);
    setShowPanelEditor(true);
  };

  const categories = [...new Set(panelTypes.map(p => p.category))];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
        onClick={() => setShowAddPanelModal(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-card border border-border rounded-xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-foreground">Add Visualization</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Choose a panel type for your dashboard</p>
          </div>
          <button
            onClick={() => setShowAddPanelModal(false)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {categories.map(category => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                <span className="px-3 py-1 bg-primary/10 rounded-full">{category}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {panelTypes.filter(p => p.category === category).map((panel) => (
                  <button
                    key={panel.name}
                    onClick={() => handleAddPanel(panel)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-transparent transition-all duration-200 group hover:shadow-lg hover:scale-105"
                  >
                    <div className="p-3 rounded-lg bg-secondary/50 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-110">
                      <panel.icon size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{panel.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{panel.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            <button
              onClick={handleAddEmptyPanel}
              className="flex-1 grafana-btn grafana-btn-secondary"
            >
              Add empty panel
            </button>
            <button
              onClick={() => {
                toast.info("Opening panel library...");
                setShowAddPanelModal(false);
              }}
              className="flex-1 grafana-btn grafana-btn-secondary"
            >
              Add from library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
