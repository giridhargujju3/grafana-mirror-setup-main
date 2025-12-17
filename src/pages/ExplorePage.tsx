import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { SearchModal } from "@/components/grafana/modals/SearchModal";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { useState, useEffect } from "react";
import { Play, Clock, ChevronDown, Database, Search, Split, History, BookOpen, Download, Table2, LineChart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const dataSources = [
  { name: "Prometheus", type: "prometheus", icon: "🔥" },
  { name: "Loki", type: "loki", icon: "📋" },
  { name: "InfluxDB", type: "influxdb", icon: "📊" },
  { name: "Elasticsearch", type: "elasticsearch", icon: "🔍" },
];

const timeRanges = [
  "Last 5 minutes",
  "Last 15 minutes",
  "Last 30 minutes",
  "Last 1 hour",
  "Last 3 hours",
  "Last 6 hours",
  "Last 12 hours",
  "Last 24 hours",
];

// Generate sample metric data
const generateMetricData = (points: number = 30) => {
  const data = [];
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 60000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      value: Math.floor(Math.random() * 50 + 30 + Math.sin(i / 5) * 20),
      value2: Math.floor(Math.random() * 30 + 20 + Math.cos(i / 5) * 15),
    });
  }
  return data;
};

// Generate sample log data
const generateLogData = () => {
  const levels = ["info", "warn", "error", "debug"] as const;
  const services = ["api-gateway", "user-service", "order-service", "payment-service"];
  const messages = [
    "Request completed successfully",
    "Connection timeout",
    "Rate limit exceeded",
    "Cache miss",
    "Database query slow",
    "Authentication successful",
    "Processing payment",
    "Order created",
  ];
  
  const logs = [];
  for (let i = 0; i < 50; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    logs.push({
      timestamp: new Date(Date.now() - i * 5000).toISOString(),
      level,
      service: services[Math.floor(Math.random() * services.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  }
  return logs;
};

function ExploreContent() {
  const { timeRange, setTimeRange } = useDashboard();
  const [selectedSource, setSelectedSource] = useState(dataSources[0]);
  const [query, setQuery] = useState("");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleRunQuery = () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate query execution
    setTimeout(() => {
      if (selectedSource.type === "loki") {
        setResults({ type: "logs", data: generateLogData() });
      } else {
        setResults({ type: "metrics", data: generateMetricData() });
      }
      setIsLoading(false);
      setQueryHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));
      toast.success("Query executed successfully");
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleRunQuery();
    }
  };

  const handleExport = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explore-results-${Date.now()}.json`;
    a.click();
    toast.success("Results exported");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">Explore</h1>
            <span className="text-xs px-2 py-1 bg-grafana-blue/20 text-grafana-blue rounded">
              {selectedSource.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded hover:bg-secondary text-muted-foreground" title="Split view">
              <Split size={18} />
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded hover:bg-secondary text-muted-foreground" 
              title="Query history"
            >
              <History size={18} />
            </button>
            <button className="p-2 rounded hover:bg-secondary text-muted-foreground" title="Query inspector">
              <BookOpen size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 space-y-4">
          {/* Query Builder */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              {/* Data source selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded hover:border-primary transition-colors min-w-[160px]"
                >
                  <Database size={16} className="text-muted-foreground" />
                  <span className="font-medium">{selectedSource.name}</span>
                  <ChevronDown size={14} className="text-muted-foreground ml-auto" />
                </button>
                {showSourceDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 py-1">
                    {dataSources.map((source) => (
                      <button
                        key={source.name}
                        onClick={() => {
                          setSelectedSource(source);
                          setShowSourceDropdown(false);
                          setResults(null);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors",
                          selectedSource.name === source.name && "bg-secondary text-primary"
                        )}
                      >
                        <span>{source.icon}</span>
                        {source.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time range */}
              <div className="relative">
                <button 
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded hover:border-primary transition-colors"
                >
                  <Clock size={16} className="text-muted-foreground" />
                  <span>{timeRange}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {showTimeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                    {timeRanges.map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setTimeRange(range);
                          setShowTimeDropdown(false);
                          if (results) handleRunQuery();
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors",
                          timeRange === range && "bg-secondary text-primary"
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Run button */}
              <button
                onClick={handleRunQuery}
                disabled={isLoading}
                className="grafana-btn grafana-btn-primary ml-auto"
              >
                <Play size={16} className={cn(isLoading && "animate-spin")} />
                Run query
              </button>
            </div>

            {/* Query input */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Enter a ${selectedSource.name} query... (Ctrl+Enter to run)`}
                className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>

            {/* Query hints */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Try:</span>
              {selectedSource.type === "prometheus" && (
                <>
                  <button onClick={() => setQuery("up")} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">up</button>
                  <button onClick={() => setQuery("rate(http_requests_total[5m])")} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">rate(http_requests_total[5m])</button>
                  <button onClick={() => setQuery("node_cpu_seconds_total")} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">node_cpu_seconds_total</button>
                  <button onClick={() => setQuery("histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))")} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">p99 latency</button>
                </>
              )}
              {selectedSource.type === "loki" && (
                <>
                  <button onClick={() => setQuery('{job="nginx"}')} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">{'{job="nginx"}'}</button>
                  <button onClick={() => setQuery('{level="error"}')} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">{'{level="error"}'}</button>
                  <button onClick={() => setQuery('{service=~".*api.*"} |= "error"')} className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors">errors in api</button>
                </>
              )}
            </div>
          </div>

          {/* Query history sidebar */}
          {showHistory && queryHistory.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Query History</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {queryHistory.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    className="w-full text-left text-sm px-3 py-2 bg-secondary/50 rounded hover:bg-secondary transition-colors font-mono truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results area */}
          {isLoading ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Executing query...</p>
            </div>
          ) : results ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Results header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {results.type === "logs" ? `${results.data.length} log entries` : `${results.data.length} data points`}
                  </span>
                  <div className="flex items-center gap-1 bg-secondary rounded p-0.5">
                    <button
                      onClick={() => setViewMode("graph")}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        viewMode === "graph" ? "bg-card text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <LineChart size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        viewMode === "table" ? "bg-card text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <Table2 size={16} />
                    </button>
                  </div>
                </div>
                <button onClick={handleExport} className="p-2 rounded hover:bg-secondary text-muted-foreground">
                  <Download size={16} />
                </button>
              </div>

              {/* Results content */}
              {results.type === "metrics" && viewMode === "graph" && (
                <div className="h-80 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.data}>
                      <defs>
                        <linearGradient id="explore-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="explore-gradient-2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
                      <XAxis dataKey="time" stroke="hsl(210, 15%, 55%)" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(210, 15%, 55%)" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(220, 18%, 15%)",
                          border: "1px solid hsl(220, 18%, 22%)",
                          borderRadius: "6px",
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(24, 100%, 50%)" strokeWidth={2} fill="url(#explore-gradient)" name="Series A" />
                      <Area type="monotone" dataKey="value2" stroke="hsl(199, 89%, 48%)" strokeWidth={2} fill="url(#explore-gradient-2)" name="Series B" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {results.type === "metrics" && viewMode === "table" && (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full">
                    <thead className="bg-secondary sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Time</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Value</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Value 2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.data.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="px-4 py-2 text-sm font-mono">{row.time}</td>
                          <td className="px-4 py-2 text-sm text-right font-mono">{row.value}</td>
                          <td className="px-4 py-2 text-sm text-right font-mono">{row.value2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {results.type === "logs" && (
                <div className="max-h-96 overflow-auto font-mono text-sm">
                  {results.data.map((log: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "px-4 py-2 border-b border-border/50 hover:bg-secondary/30",
                        log.level === "error" && "bg-destructive/5",
                        log.level === "warn" && "bg-grafana-yellow/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium uppercase",
                            log.level === "info" && "bg-grafana-blue/20 text-grafana-blue",
                            log.level === "warn" && "bg-grafana-yellow/20 text-grafana-yellow",
                            log.level === "error" && "bg-grafana-red/20 text-grafana-red",
                            log.level === "debug" && "bg-secondary text-muted-foreground"
                          )}
                        >
                          {log.level}
                        </span>
                        <span className="text-muted-foreground">[{log.service}]</span>
                        <span className="text-foreground flex-1">{log.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="text-muted-foreground">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Enter a query to explore your data</p>
                <p className="text-sm mt-2">Select a data source and enter a query above to visualize your metrics, logs, or traces.</p>
              </div>
            </div>
          )}
        </main>
      </div>
      <SearchModal />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <DashboardProvider>
      <ExploreContent />
    </DashboardProvider>
  );
}
