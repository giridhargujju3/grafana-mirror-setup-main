import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  X, Play, ChevronDown, ChevronRight, Database, Plus, Trash2, Save, 
  ArrowLeft, Settings, Code, Layers, AlertTriangle, Eye, EyeOff,
  Copy, Maximize2, Move, RotateCcw, HelpCircle
} from "lucide-react";
import { useDashboard, PanelConfig, QueryTarget } from "@/contexts/DashboardContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SQLQueryBuilder } from "../panels/SQLQueryBuilder";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const visualizationTypes = [
  { id: "timeseries", name: "Time series", icon: "📈" },
  { id: "stat", name: "Stat", icon: "📊" },
  { id: "gauge", name: "Gauge", icon: "🎯" },
  { id: "barchart", name: "Bar chart", icon: "📊" },
  { id: "table", name: "Table", icon: "📋" },
  { id: "piechart", name: "Pie chart", icon: "🥧" },
  { id: "alertlist", name: "Alert list", icon: "🚨" },
  { id: "logs", name: "Logs", icon: "📝" },
  { id: "text", name: "Text", icon: "📄" },
];

const CHART_COLORS = [
  "hsl(24, 100%, 50%)",
  "hsl(199, 89%, 48%)",
  "hsl(142, 71%, 45%)",
  "hsl(270, 70%, 60%)",
  "hsl(38, 92%, 50%)",
];

// Generate preview data based on visualization type
const generatePreviewData = (vizType: string) => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      time: `${String(i).padStart(2, "0")}:00`,
      value: Math.floor(Math.random() * 50 + 30),
      value2: Math.floor(Math.random() * 40 + 20),
    });
  }
  return data;
};

const generatePieData = () => [
  { name: "CPU", value: 35 },
  { name: "Memory", value: 25 },
  { name: "Network", value: 20 },
  { name: "Disk", value: 15 },
  { name: "Other", value: 5 },
];

export function PanelEditorModal() {
  const { 
    showPanelEditor, 
    setShowPanelEditor, 
    editingPanel, 
    setEditingPanel, 
    updatePanel, 
    addPanel,
    dataSources,
    setShowDataSourceSelector,
    selectedDataSource,
    setShowSaveDashboardModal,
    dashboardState,
    selectedVizType,
    setSelectedVizType,
    panels, // Add panels to access current panels
  } = useDashboard();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vizType, setVizType] = useState<string>("timeseries");
  const [queries, setQueries] = useState<QueryTarget[]>([]);
  const [showVizDropdown, setShowVizDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"query" | "transform" | "alert">("query");
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [queryMode, setQueryMode] = useState<"builder" | "code">("code");
  const [showOptions, setShowOptions] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  const previewData = useMemo(() => generatePreviewData(vizType), [vizType, isRunning]);
  const pieData = useMemo(() => generatePieData(), []);

  useEffect(() => {
    console.log('PanelEditorModal useEffect - editingPanel:', editingPanel?.id || 'NULL', 'selectedVizType:', selectedVizType);
    if (editingPanel) {
      console.log('Setting up for EDITING panel:', editingPanel.id);
      setTitle(editingPanel.title);
      setDescription(editingPanel.description || "");
      setVizType(editingPanel.type);
      setQueries(editingPanel.targets || [{ refId: "A", expr: "", datasource: "prometheus", queryMode: "code" }]);
    } else {
      console.log('Setting up for NEW panel with vizType:', selectedVizType || 'timeseries');
      setTitle("New Panel");
      setDescription("");
      setVizType(selectedVizType || "timeseries");
      setQueries([{ refId: "A", expr: "", datasource: selectedDataSource?.id || "prometheus", queryMode: "code" }]);
    }
  }, [editingPanel, selectedDataSource, selectedVizType]);

  if (!showPanelEditor) return null;
  console.log('PanelEditorModal rendering - editingPanel:', editingPanel?.id || 'NULL');

  const handleRunQuery = async () => {
    const currentQuery = queries[activeQueryIndex];
    if (!currentQuery?.expr?.trim()) {
      toast.error("Please enter a query");
      return;
    }

    console.log('Executing query with datasource:', currentQuery.datasource);
    console.log('Query:', currentQuery.expr);

    setIsRunning(true);
    try {
      const response = await fetch('http://localhost:3001/api/query/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasource: currentQuery.datasource,
          query: currentQuery.expr
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (!response.ok) {
        console.error('Query failed:', result);
        if (result.error?.includes('No data sources configured')) {
          toast.error('No PostgreSQL data sources configured. Please add a data source first in the sidebar.');
        } else {
          toast.error(`Query failed: ${result.error || 'Unknown error'}`);
        }
        return;
      }
      
      if (result.success) {
        toast.success(`Query executed: ${result.data.rowCount} rows returned`);
        // Store the result for visualization
        setQueryResult(result.data);
      } else {
        toast.error(`Query failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      toast.error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAllQueries = async () => {
    setIsRunning(true);
    let successCount = 0;
    let hasDataSourceError = false;
    
    for (const query of queries) {
      if (query.expr?.trim()) {
        try {
          const response = await fetch('http://localhost:3001/api/query/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              datasource: query.datasource,
              query: query.expr
            })
          });
          
          const result = await response.json();
          if (response.ok && result.success) {
            successCount++;
          } else if (result.error?.includes('No data sources configured')) {
            hasDataSourceError = true;
            break;
          }
        } catch (error) {
          console.error(`Query ${query.refId} failed:`, error);
        }
      }
    }
    
    setIsRunning(false);
    
    if (hasDataSourceError) {
      toast.error('No PostgreSQL data sources configured. Please add a data source first in the sidebar.');
    } else {
      toast.success(`${successCount}/${queries.length} queries executed successfully`);
    }
  };

  const handleAddQuery = () => {
    const nextRefId = String.fromCharCode(65 + queries.length);
    setQueries([...queries, { 
      refId: nextRefId, 
      expr: "", 
      datasource: selectedDataSource?.id || "prometheus",
      queryMode: "code" 
    }]);
    setActiveQueryIndex(queries.length);
  };

  const handleRemoveQuery = (index: number) => {
    const newQueries = queries.filter((_, i) => i !== index);
    setQueries(newQueries);
    if (activeQueryIndex >= newQueries.length) {
      setActiveQueryIndex(Math.max(0, newQueries.length - 1));
    }
  };

  const handleUpdateQuery = (index: number, field: keyof QueryTarget, value: string) => {
    const updated = [...queries];
    updated[index] = { ...updated[index], [field]: value };
    setQueries(updated);
  };

  const handleDuplicateQuery = (index: number) => {
    const query = queries[index];
    const nextRefId = String.fromCharCode(65 + queries.length);
    setQueries([...queries, { ...query, refId: nextRefId }]);
  };

  const handleApply = () => {
    // Check if this is truly a new panel or existing panel
    const isExistingPanel = editingPanel && panels.some(p => p.id === editingPanel.id);
    
    if (isExistingPanel) {
      console.log('Updating existing panel:', editingPanel.id);
      updatePanel(editingPanel.id, {
        title,
        description,
        type: vizType as PanelConfig["type"],
        targets: queries,
      });
      toast.success("Panel updated");
    } else {
      const newPanel: PanelConfig = {
        id: `panel-${Date.now()}`,
        type: vizType as PanelConfig["type"],
        title,
        description,
        gridPos: { x: 0, y: 0, w: 6, h: 4 },
        options: {},
        targets: queries,
      };
      console.log('Adding new panel:', newPanel.id, 'Title:', title);
      console.log('editingPanel was:', editingPanel?.id, 'but treating as new');
      addPanel(newPanel);
      toast.success("Panel added to dashboard");
    }
    
    setShowPanelEditor(false);
    setEditingPanel(null);
    setSelectedVizType(null);
    
    // Show save modal after panel is added (for new dashboards)
    if (dashboardState.isNew) {
      setTimeout(() => {
        setShowSaveDashboardModal(true);
      }, 200); // Increased delay to ensure panel is added
    }
  };

  const handleDiscard = () => {
    setShowPanelEditor(false);
    setEditingPanel(null);
    setSelectedVizType(null);
    toast.info("Changes discarded");
  };

  const handleBackToDashboard = () => {
    handleApply();
  };

  const getDataSourceType = (datasourceId: string) => {
    const ds = dataSources.find(d => d.id === datasourceId);
    return ds ? ds.type : datasourceId;
  };

  const getQueryHints = (datasourceId: string) => {
    const type = getDataSourceType(datasourceId);
    switch (type) {
      case "prometheus":
        return [
          "up",
          "rate(http_requests_total[5m])",
          "node_cpu_seconds_total",
          "sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)",
        ];
      case "loki":
        return [
          '{job="nginx"}',
          '{level="error"}',
          'rate({job="app"}[5m])',
          '{namespace="production"} |= "error"',
        ];
      case "postgres":
      case "mysql":
        return [
          "SELECT * FROM users LIMIT 10",
          "SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '1 day'",
        ];
      default:
        return ["Enter your query..."];
    }
  };

  const renderPreview = () => {
    switch (vizType) {
      case "timeseries":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={previewData}>
              <defs>
                {queries.map((q, i) => (
                  <linearGradient key={q.refId} id={`gradient-${q.refId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
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
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                name={queries[0]?.refId || "A"}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                fill={`url(#gradient-${queries[0]?.refId || "A"})`}
              />
              {queries.length > 1 && (
                <Area
                  type="monotone"
                  dataKey="value2"
                  name={queries[1]?.refId || "B"}
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  fill={`url(#gradient-${queries[1]?.refId || "B"})`}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
      case "barchart":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={previewData.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" />
              <XAxis type="number" stroke="hsl(210, 15%, 55%)" fontSize={11} />
              <YAxis dataKey="time" type="category" stroke="hsl(210, 15%, 55%)" fontSize={11} width={50} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 18%, 15%)",
                  border: "1px solid hsl(220, 18%, 22%)",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="value" fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "piechart":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "stat":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl font-bold text-grafana-orange">{Math.floor(Math.random() * 100)}</div>
              <div className="text-sm text-muted-foreground mt-2">{title}</div>
            </div>
          </div>
        );
      case "gauge":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(220, 18%, 22%)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(24, 100%, 50%)"
                  strokeWidth="8"
                  strokeDasharray={`${72 * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" className="text-2xl font-bold fill-foreground">72%</text>
              </svg>
            </div>
          </div>
        );
      case "table":
        if (queryResult && queryResult.columns && queryResult.rows) {
          return (
            <div className="w-full h-full overflow-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {queryResult.columns.map((col: string, i: number) => (
                      <th key={i} className="text-left p-2 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.slice(0, 100).map((row: any[], i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {queryResult.rows.length > 100 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Showing first 100 of {queryResult.rowCount} rows
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Execute a query to see table data</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Preview for {vizType}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to dashboard</span>
          </button>
          <span className="text-border">|</span>
          <span className="text-sm text-muted-foreground">
            {editingPanel ? "Edit panel" : "New panel"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDiscard} className="grafana-btn grafana-btn-secondary">
            Discard
          </button>
          <button onClick={handleApply} className="grafana-btn grafana-btn-primary">
            <Save size={16} />
            Save dashboard
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Panel title input */}
          <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium bg-transparent border-none focus:outline-none text-foreground flex-1"
              placeholder="Panel title"
            />
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title="Panel options">
                <Settings size={18} />
              </button>
              <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title="Maximize">
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          {/* Preview panel */}
          <div className="h-1/2 border-b border-border p-4 bg-secondary/20">
            <div className="grafana-panel h-full">
              <div className="grafana-panel-header">
                <h3 className="grafana-panel-title">{title || "Panel Preview"}</h3>
                <div className="flex items-center gap-1">
                  {isRunning && (
                    <span className="text-xs text-grafana-blue animate-pulse">Running...</span>
                  )}
                </div>
              </div>
              <div className="grafana-panel-content h-[calc(100%-48px)]">
                {renderPreview()}
              </div>
            </div>
          </div>

          {/* Query section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="border-b border-border flex items-center justify-between px-4">
              <div className="flex">
                {(["query", "transform", "alert"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                    {tab === "query" && (
                      <span className="ml-1.5 text-xs bg-secondary px-1.5 py-0.5 rounded">{queries.length}</span>
                    )}
                  </button>
                ))}
              </div>
              {activeTab === "query" && (
                <button
                  onClick={handleRunAllQueries}
                  className="grafana-btn grafana-btn-primary text-xs"
                  disabled={isRunning}
                >
                  <Play size={14} />
                  Run queries
                </button>
              )}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              {activeTab === "query" && (
                <div className="p-4 space-y-4">
                  {/* Query tabs */}
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    {queries.map((query, index) => (
                      <button
                        key={query.refId}
                        onClick={() => setActiveQueryIndex(index)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-t transition-colors",
                          activeQueryIndex === index
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span 
                          className="w-5 h-5 rounded text-xs font-medium flex items-center justify-center"
                          style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}30`, color: CHART_COLORS[index % CHART_COLORS.length] }}
                        >
                          {query.refId}
                        </span>
                        <span className="max-w-[100px] truncate">{query.expr || "No query"}</span>
                      </button>
                    ))}
                    <button
                      onClick={handleAddQuery}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                      title="Add query"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Active query editor */}
                  {queries[activeQueryIndex] && (
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      {/* Query header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
                        <div className="flex items-center gap-3">
                          <span 
                            className="w-6 h-6 rounded text-sm font-medium flex items-center justify-center"
                            style={{ 
                              backgroundColor: `${CHART_COLORS[activeQueryIndex % CHART_COLORS.length]}30`, 
                              color: CHART_COLORS[activeQueryIndex % CHART_COLORS.length] 
                            }}
                          >
                            {queries[activeQueryIndex].refId}
                          </span>
                          
                          {/* Data source selector */}
                          <button
                            onClick={() => setShowDataSourceSelector(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded hover:border-primary transition-colors text-sm"
                          >
                            <Database size={14} />
                            <span>
                              {dataSources.find(ds => ds.id === queries[activeQueryIndex].datasource)?.name || 
                               (typeof queries[activeQueryIndex].datasource === 'string' ? queries[activeQueryIndex].datasource : "Select data source")}
                            </span>
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Query mode toggle */}
                          <div className="flex items-center bg-secondary rounded p-0.5">
                            <button
                              onClick={() => handleUpdateQuery(activeQueryIndex, "queryMode", "builder")}
                              className={cn(
                                "px-2 py-1 text-xs rounded transition-colors",
                                queries[activeQueryIndex].queryMode === "builder"
                                  ? "bg-card text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Builder
                            </button>
                            <button
                              onClick={() => handleUpdateQuery(activeQueryIndex, "queryMode", "code")}
                              className={cn(
                                "px-2 py-1 text-xs rounded transition-colors",
                                queries[activeQueryIndex].queryMode !== "builder"
                                  ? "bg-card text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Code
                            </button>
                          </div>
                          
                          <button
                            onClick={handleRunQuery}
                            className="grafana-btn grafana-btn-primary text-xs py-1"
                            disabled={isRunning}
                          >
                            <Play size={14} />
                          </button>
                          <button
                            onClick={() => handleDuplicateQuery(activeQueryIndex)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                            title="Duplicate query"
                          >
                            <Copy size={14} />
                          </button>
                          {queries.length > 1 && (
                            <button
                              onClick={() => handleRemoveQuery(activeQueryIndex)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                              title="Remove query"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Query input */}
                      <div className="p-4 space-y-3">
                        {queries[activeQueryIndex].queryMode === "builder" ? (
                          // Check if it's a SQL data source
                          ["postgres", "mysql"].includes(getDataSourceType(queries[activeQueryIndex].datasource)) ? (
                            <SQLQueryBuilder
                              datasource={getDataSourceType(queries[activeQueryIndex].datasource)}
                              value={queries[activeQueryIndex].expr}
                              onChange={(query) => handleUpdateQuery(activeQueryIndex, "expr", query)}
                            />
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Metric</label>
                                  <select className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    <option>cpu_usage</option>
                                    <option>memory_usage</option>
                                    <option>http_requests_total</option>
                                    <option>node_cpu_seconds_total</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Label filters</label>
                                  <input
                                    type="text"
                                    placeholder="job, instance, ..."
                                    className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Aggregation</label>
                                  <select className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    <option>None</option>
                                    <option>sum</option>
                                    <option>avg</option>
                                    <option>max</option>
                                    <option>min</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Range</label>
                                  <select className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    <option>$__rate_interval</option>
                                    <option>1m</option>
                                    <option>5m</option>
                                    <option>15m</option>
                                    <option>1h</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Resolution</label>
                                  <select className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                    <option>1/1</option>
                                    <option>1/2</option>
                                    <option>1/3</option>
                                    <option>1/5</option>
                                    <option>1/10</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          <>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Query expression</label>
                              <textarea
                                value={queries[activeQueryIndex].expr}
                                onChange={(e) => handleUpdateQuery(activeQueryIndex, "expr", e.target.value)}
                                placeholder={getQueryHints(queries[activeQueryIndex].datasource)[0]}
                                className="w-full px-3 py-2 bg-input border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
                              />
                            </div>
                            
                            {/* Quick examples */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">Examples:</span>
                              {getQueryHints(queries[activeQueryIndex].datasource).map((hint, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleUpdateQuery(activeQueryIndex, "expr", hint)}
                                  className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 font-mono truncate max-w-[200px]"
                                >
                                  {hint}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Legend format */}
                        <div className="flex items-center gap-4 pt-2 border-t border-border">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs text-muted-foreground">Legend</label>
                            <input
                              type="text"
                              value={queries[activeQueryIndex].legendFormat || ""}
                              onChange={(e) => handleUpdateQuery(activeQueryIndex, "legendFormat", e.target.value)}
                              placeholder="{{label_name}}"
                              className="w-full px-3 py-1.5 bg-input border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add query button */}
                  <button
                    onClick={handleAddQuery}
                    className="w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add query
                  </button>
                </div>
              )}

              {activeTab === "transform" && (
                <div className="p-4">
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Transformations</p>
                    <p className="text-sm mb-4">Add transformations to manipulate your query results</p>
                    <button className="grafana-btn grafana-btn-secondary">
                      <Plus size={16} />
                      Add transformation
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "alert" && (
                <div className="p-4">
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Alert Rules</p>
                    <p className="text-sm mb-4">Create alert rules for this panel's query</p>
                    <button className="grafana-btn grafana-btn-secondary">
                      <Plus size={16} />
                      Create alert rule
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar - Panel options */}
        <div className={cn(
          "border-l border-border bg-card overflow-y-auto transition-all",
          showOptions ? "w-80" : "w-0"
        )}>
          {showOptions && (
            <>
              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground mb-4">Panel options</h3>
                
                {/* Title */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Panel description"
                    className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="p-4 border-b border-border">
                <h3 className="font-medium text-foreground mb-3">Visualization</h3>
                
                {/* Visualization type grid */}
                <div className="grid grid-cols-3 gap-2">
                  {visualizationTypes.map((viz) => (
                    <button
                      key={viz.id}
                      onClick={() => setVizType(viz.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded transition-colors text-center",
                        vizType === viz.id
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-secondary hover:bg-secondary/80 border border-transparent"
                      )}
                    >
                      <span className="text-lg">{viz.icon}</span>
                      <span className="text-xs text-muted-foreground">{viz.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-foreground mb-3">Standard options</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Unit</label>
                    <select className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>none</option>
                      <option>percent (0-100)</option>
                      <option>bytes</option>
                      <option>short</option>
                      <option>duration (ms)</option>
                      <option>requests/sec</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Min</label>
                    <input
                      type="number"
                      placeholder="auto"
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Max</label>
                    <input
                      type="number"
                      placeholder="auto"
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Decimals</label>
                    <input
                      type="number"
                      placeholder="auto"
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}