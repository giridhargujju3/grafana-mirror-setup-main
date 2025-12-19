import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useState, useEffect } from "react";
import { ArrowLeft, Play, Settings, Save, Database, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PostgreSQLDataSource } from "@/lib/postgresDataSource";

interface DataSource {
  id: string;
  name: string;
  type: string;
}

function PanelEditorContent() {
  const navigate = useNavigate();
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showDataSourceSelector, setShowDataSourceSelector] = useState(false);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [visualizationType, setVisualizationType] = useState("timeseries");

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      const sources = await PostgreSQLDataSource.listDataSources();
      setDataSources(sources);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    }
  };

  const executeQuery = async () => {
    if (!selectedDataSource || !query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/query/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasource: selectedDataSource.id,
          query: query.trim()
        })
      });

      const result = await response.json();
      setQueryResult(result);
    } catch (error) {
      console.error('Query execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/new')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-foreground">Edit panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/dashboard/new')}
              className="grafana-btn grafana-btn-secondary"
            >
              Back to dashboard
            </button>
            <button className="grafana-btn grafana-btn-destructive">
              Discard panel
            </button>
            <button className="grafana-btn grafana-btn-primary">
              <Save size={16} />
              Save dashboard
            </button>
          </div>
        </header>

        {/* Time controls */}
        <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Table view</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <select className="grafana-input text-sm">
              <option>Last 6 hours</option>
              <option>Last 12 hours</option>
              <option>Last 24 hours</option>
            </select>
            <button className="grafana-btn grafana-btn-secondary text-sm">
              Refresh
            </button>
            <select 
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value)}
              className="grafana-input text-sm"
            >
              <option value="timeseries">Time series</option>
              <option value="table">Table</option>
              <option value="stat">Stat</option>
              <option value="barchart">Bar chart</option>
              <option value="gauge">Gauge</option>
            </select>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Main panel area */}
          <div className="flex-1 flex flex-col">
            {/* Panel preview */}
            <div className="flex-1 bg-card border-b border-border p-6">
              <div className="h-full border border-border rounded bg-background flex items-center justify-center">
                {queryResult ? (
                  <div className="w-full h-full p-4">
                    {visualizationType === "table" ? (
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {queryResult.data?.columns?.map((col: string, i: number) => (
                                <th key={i} className="text-left p-2">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data?.rows?.slice(0, 10).map((row: any[], i: number) => (
                              <tr key={i} className="border-b">
                                {row.map((cell, j) => (
                                  <td key={j} className="p-2">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        {visualizationType} visualization preview
                        <div className="mt-2 text-sm">
                          {queryResult.data?.rowCount} rows returned
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="text-lg mb-2">No data</div>
                    <div className="text-sm">
                      {selectedDataSource ? "Execute a query to see data" : "Select a data source to get started"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Query editor */}
            <div className="h-80 bg-card border-b border-border">
              <div className="flex border-b border-border">
                <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
                  Queries
                </button>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground">
                  Transformations
                </button>
                <button className="px-4 py-2 text-sm font-medium text-muted-foreground">
                  Alert
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Data source</span>
                    <button
                      onClick={() => setShowDataSourceSelector(true)}
                      className="flex items-center gap-2 px-3 py-1 border border-border rounded hover:bg-secondary"
                    >
                      <Database size={16} />
                      <span className="text-sm">
                        {selectedDataSource ? selectedDataSource.name : "Select data source"}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Query options</span>
                    <span>MD = auto ≤ 500</span>
                    <span>Interval = 1m</span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm text-muted-foreground">Query inspector</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">A</span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedDataSource?.name || "no data source"})
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Format:</span>
                      <select className="grafana-input text-sm">
                        <option>Table</option>
                        <option>Time series</option>
                      </select>
                    </div>

                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={selectedDataSource ? "SELECT * FROM your_table LIMIT 10" : "Select a data source first"}
                      disabled={!selectedDataSource}
                      className="w-full h-24 grafana-input font-mono text-sm resize-none"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={executeQuery}
                          disabled={!selectedDataSource || !query.trim() || loading}
                          className="grafana-btn grafana-btn-primary text-sm"
                        >
                          <Play size={14} />
                          {loading ? "Running..." : "Run query"}
                        </button>
                        <button className="grafana-btn grafana-btn-secondary text-sm">
                          Builder
                        </button>
                        <button className="grafana-btn grafana-btn-secondary text-sm">
                          Code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-80 bg-card border-l border-border overflow-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search size={16} className="text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search options"
                  className="flex-1 grafana-input text-sm"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Panel options</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input 
                        type="text" 
                        placeholder="Panel Title"
                        className="w-full grafana-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea 
                        placeholder=""
                        className="w-full grafana-input text-sm h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Legend</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Visibility</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Selector Modal */}
      {showDataSourceSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDataSourceSelector(false)} />
          <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Select data source</h2>
              <button onClick={() => setShowDataSourceSelector(false)} className="text-muted-foreground hover:text-foreground">
                ×
              </button>
            </div>
            <div className="p-4">
              <input 
                type="text" 
                placeholder="Select data source"
                className="w-full grafana-input mb-4"
              />
              <div className="space-y-2 max-h-60 overflow-auto">
                {dataSources.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => {
                      setSelectedDataSource(ds);
                      setShowDataSourceSelector(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary rounded text-left"
                  >
                    <Database size={20} className="text-primary" />
                    <div>
                      <div className="font-medium">{ds.name}</div>
                      <div className="text-sm text-muted-foreground">{ds.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PanelEditorPage() {
  return (
    <DashboardProvider>
      <PanelEditorContent />
    </DashboardProvider>
  );
}