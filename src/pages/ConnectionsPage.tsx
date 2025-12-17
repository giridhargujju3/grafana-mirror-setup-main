import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { SearchModal } from "@/components/grafana/modals/SearchModal";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useState } from "react";
import { Database, Plus, Search, CheckCircle, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

const dataSources = [
  { name: "Prometheus", type: "prometheus", url: "http://prometheus:9090", status: "connected", default: true },
  { name: "Loki", type: "loki", url: "http://loki:3100", status: "connected", default: false },
  { name: "InfluxDB", type: "influxdb", url: "http://influxdb:8086", status: "connected", default: false },
  { name: "PostgreSQL", type: "postgres", url: "postgres://localhost:5432", status: "error", default: false },
];

const availableDataSources = [
  { name: "Prometheus", description: "Open source monitoring and alerting toolkit" },
  { name: "Loki", description: "Log aggregation system" },
  { name: "InfluxDB", description: "Time series database" },
  { name: "MySQL", description: "Relational database" },
  { name: "PostgreSQL", description: "Relational database" },
  { name: "Elasticsearch", description: "Search and analytics engine" },
  { name: "Graphite", description: "Time series database" },
  { name: "CloudWatch", description: "AWS monitoring service" },
];

function ConnectionsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredSources = dataSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">Data Sources</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="grafana-btn grafana-btn-primary"
          >
            <Plus size={16} />
            Add data source
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search data sources..."
              className="w-full pl-10 pr-4 py-2 grafana-input"
            />
          </div>

          {/* Data Sources List */}
          <div className="space-y-3">
            {filteredSources.map((source) => (
              <div
                key={source.name}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary rounded-lg">
                      <Database size={24} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{source.name}</span>
                        {source.default && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">default</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{source.type}</div>
                      <div className="text-sm text-muted-foreground">{source.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 ${source.status === "connected" ? "text-grafana-green" : "text-grafana-red"}`}>
                      <CheckCircle size={16} />
                      <span className="text-sm capitalize">{source.status}</span>
                    </div>
                    <button
                      onClick={() => toast.info(`Configuring ${source.name}...`)}
                      className="p-2 rounded hover:bg-secondary text-muted-foreground transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => toast.success(`${source.name} deleted`)}
                      className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Add Data Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-lg shadow-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add data source</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableDataSources.map((source) => (
                  <button
                    key={source.name}
                    onClick={() => {
                      toast.success(`${source.name} data source added`);
                      setShowAddModal(false);
                    }}
                    className="flex items-center gap-3 p-4 bg-secondary/50 border border-border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <Database size={24} className="text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{source.name}</div>
                      <div className="text-sm text-muted-foreground">{source.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <SearchModal />
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <DashboardProvider>
      <ConnectionsContent />
    </DashboardProvider>
  );
}
