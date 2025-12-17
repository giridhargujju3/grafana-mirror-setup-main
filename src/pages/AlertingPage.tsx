import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { SearchModal } from "@/components/grafana/modals/SearchModal";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Clock, Plus, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const alertRules = [
  { name: "High CPU Usage", state: "firing", severity: "critical", instances: 3, lastEvaluation: "10s ago" },
  { name: "Memory Threshold", state: "pending", severity: "warning", instances: 1, lastEvaluation: "15s ago" },
  { name: "Disk Space Low", state: "normal", severity: "warning", instances: 0, lastEvaluation: "20s ago" },
  { name: "API Error Rate", state: "firing", severity: "critical", instances: 2, lastEvaluation: "10s ago" },
  { name: "Network Latency", state: "normal", severity: "info", instances: 0, lastEvaluation: "25s ago" },
];

const stateConfig = {
  firing: { icon: XCircle, color: "text-grafana-red", bg: "bg-grafana-red/10" },
  pending: { icon: Clock, color: "text-grafana-yellow", bg: "bg-grafana-yellow/10" },
  normal: { icon: CheckCircle, color: "text-grafana-green", bg: "bg-grafana-green/10" },
};

function AlertingContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredRules = alertRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = !selectedState || rule.state === selectedState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-foreground">Alerting</h1>
          <button
            onClick={() => toast.success("Create alert rule dialog opened")}
            className="grafana-btn grafana-btn-primary"
          >
            <Plus size={16} />
            New alert rule
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-grafana-red/20 rounded">
                  <XCircle size={20} className="text-grafana-red" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">2</div>
                  <div className="text-sm text-muted-foreground">Firing</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-grafana-yellow/20 rounded">
                  <Clock size={20} className="text-grafana-yellow" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">1</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-grafana-green/20 rounded">
                  <CheckCircle size={20} className="text-grafana-green" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">2</div>
                  <div className="text-sm text-muted-foreground">Normal</div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  <AlertTriangle size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">5</div>
                  <div className="text-sm text-muted-foreground">Total Rules</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alert rules..."
                className="w-full pl-10 pr-4 py-2 grafana-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              {["firing", "pending", "normal"].map((state) => (
                <button
                  key={state}
                  onClick={() => setSelectedState(selectedState === state ? null : state)}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm capitalize transition-colors",
                    selectedState === state
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Rules Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Instances</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Last evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRules.map((rule) => {
                  const config = stateConfig[rule.state as keyof typeof stateConfig];
                  const StateIcon = config.icon;
                  return (
                    <tr
                      key={rule.name}
                      onClick={() => toast.info(`Opening alert rule: ${rule.name}`)}
                      className="hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className={cn("inline-flex items-center gap-2 px-2 py-1 rounded", config.bg)}>
                          <StateIcon size={14} className={config.color} />
                          <span className={cn("text-sm capitalize", config.color)}>{rule.state}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{rule.name}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "grafana-badge",
                          rule.severity === "critical" && "grafana-badge-error",
                          rule.severity === "warning" && "grafana-badge-warning",
                          rule.severity === "info" && "bg-grafana-blue/20 text-grafana-blue"
                        )}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.instances}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.lastEvaluation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      <SearchModal />
    </div>
  );
}

export default function AlertingPage() {
  return (
    <DashboardProvider>
      <AlertingContent />
    </DashboardProvider>
  );
}
