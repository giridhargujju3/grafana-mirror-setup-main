import { useState, useEffect } from "react";
import { X, Search, Database, Cloud, Server, Table2, Zap, Check, Layers, LayoutDashboard, Sparkles } from "lucide-react";
import { useDashboard, DataSource, PanelConfig } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { PostgreSQLDataSource } from "@/lib/postgresDataSource";
import { toast } from "sonner";

const dataSourceIcons: Record<string, React.ReactNode> = {
  prometheus: <Cloud size={24} className="text-grafana-orange" />,
  loki: <Zap size={24} className="text-grafana-yellow" />,
  postgres: <Database size={24} className="text-grafana-blue" />,
  mysql: <Database size={24} className="text-grafana-blue" />,
  influxdb: <Server size={24} className="text-grafana-purple" />,
  elasticsearch: <Search size={24} className="text-grafana-green" />,
  testdata: <Table2 size={24} className="text-muted-foreground" />,
};

const dataSourceDescriptions: Record<string, string> = {
  prometheus: "Open-source monitoring and alerting toolkit",
  loki: "Log aggregation system designed for cloud native",
  postgres: "PostgreSQL database for structured data",
  mysql: "MySQL relational database",
  influxdb: "Time series database for metrics and events",
  elasticsearch: "Search and analytics engine",
  testdata: "Generate test data for development",
};

// Special data sources shown on the right side
const specialDataSources = [
  { id: "mixed", name: "-- Mixed --", description: "Use multiple data sources", icon: Layers },
  { id: "dashboard", name: "-- Dashboard --", description: "Reuse query results from other visualizations", icon: LayoutDashboard },
  { id: "grafana", name: "-- Grafana --", description: "Discover visualizations using mock data", icon: Sparkles },
];

interface DataSourceSelectorProps {
  onSelect?: (ds: DataSource) => void;
  showAsPopup?: boolean;
}

export function DataSourceSelector({ onSelect, showAsPopup = false }: DataSourceSelectorProps) {
  const { 
    showDataSourceSelector, 
    setShowDataSourceSelector, 
    selectedDataSource,
    setSelectedDataSource,
    setShowPanelEditor,
    setEditingPanel,
    addPanel,
    panels,
  } = useDashboard();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [realDataSources, setRealDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      console.log('Loading data sources from backend...');
      const sources = await PostgreSQLDataSource.listDataSources();
      console.log('Loaded data sources:', sources);
      
      const mappedSources: DataSource[] = sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type as any,
        isDefault: source.isDefault || false
      }));
      
      console.log('Mapped data sources:', mappedSources);
      setRealDataSources(mappedSources);
      
      if (mappedSources.length === 0) {
        console.warn('No data sources returned from backend');
      }
    } catch (error) {
      console.error('Failed to load data sources:', error);
      // Show the actual error to user
      toast.error(`Failed to load data sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to empty array to show "No data sources found"
      setRealDataSources([]);
    } finally {
      setLoading(false);
    }
  };

  if (!showDataSourceSelector && !showAsPopup) return null;

  const filteredDataSources = realDataSources.filter(ds => 
    ds.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (ds: DataSource) => {
    setSelectedDataSource(ds);
    
    // Create new panel with this data source and open panel editor
    const maxY = panels.reduce((max, p) => Math.max(max, p.gridPos.y + p.gridPos.h), 0);
    
    const newPanel: PanelConfig = {
      id: `panel-${Date.now()}`,
      type: "timeseries",
      title: "Panel Title",
      gridPos: { x: 0, y: maxY, w: 12, h: 4 },
      options: {},
      targets: [{ 
        refId: "A", 
        expr: "", 
        datasource: ds.id,
        queryMode: "builder",
        legendFormat: ""
      }],
    };
    
    if (onSelect) onSelect(ds);
    setShowDataSourceSelector(false);
    
    // Open panel editor with the new panel (don't add to dashboard yet)
    setEditingPanel(newPanel);
    setShowPanelEditor(true);
  };

  const handleSpecialSelect = (specialDs: typeof specialDataSources[0]) => {
    // For special sources, create panel with testdata source for now
    const maxY = panels.reduce((max, p) => Math.max(max, p.gridPos.y + p.gridPos.h), 0);
    
    const newPanel: PanelConfig = {
      id: `panel-${Date.now()}`,
      type: "timeseries",
      title: "Panel Title",
      gridPos: { x: 0, y: maxY, w: 12, h: 4 },
      options: {},
      targets: [{ 
        refId: "A", 
        expr: "", 
        datasource: specialDs.id,
        queryMode: "builder",
        legendFormat: ""
      }],
    };
    
    setShowDataSourceSelector(false);
    setEditingPanel(newPanel);
    setShowPanelEditor(true);
  };

  const content = (
    <div className="w-full max-w-4xl flex">
      {/* Left side - Data sources list */}
      <div className="flex-1 border-r border-border">
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Select data source"
              className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Data sources list */}
        <div className="max-h-80 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading data sources...
            </div>
          ) : filteredDataSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-2">No data sources found</div>
              <button 
                onClick={loadDataSources}
                className="text-xs px-3 py-1 bg-secondary rounded hover:bg-secondary/80"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDataSources.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => handleSelect(ds)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    selectedDataSource?.id === ds.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-secondary">
                    {dataSourceIcons[ds.type] || <Database size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{ds.name}</span>
                      {ds.isDefault && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded">default</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{ds.type}</span>
                  {selectedDataSource?.id === ds.id && (
                    <Check size={16} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Special data sources */}
      <div className="w-72 p-4">
        <div className="space-y-3">
          {specialDataSources.map((special) => (
            <button
              key={special.id}
              onClick={() => handleSpecialSelect(special)}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
            >
              <div className="w-8 h-8 rounded flex items-center justify-center bg-secondary shrink-0">
                <special.icon size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm">{special.name}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{special.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Configure new data source link */}
        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Open a new tab and configure a data source
          </p>
          <button className="w-full px-4 py-2 border border-border rounded text-sm font-medium hover:bg-secondary transition-colors">
            Configure a new data source
          </button>
        </div>
      </div>
    </div>
  );

  if (showAsPopup) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowDataSourceSelector(false)}
      />
      <div className="relative bg-card border border-border rounded-lg shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Select data source</h2>
          <button
            onClick={() => setShowDataSourceSelector(false)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}