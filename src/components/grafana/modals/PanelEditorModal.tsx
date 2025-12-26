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
import { TimeSeriesPanel } from "../panels/TimeSeriesPanel";
import { StatPanel } from "../panels/StatPanel";
import { GaugePanel } from "../panels/GaugePanel";
import { BarChartPanel } from "../panels/BarChartPanel";
import { TablePanel } from "../panels/TablePanel";
import { PieChartPanel } from "../panels/PieChartPanel";
import { AlertListPanel } from "../panels/AlertListPanel";
import { HistogramPanel } from "../panels/HistogramPanel";
import { XYChartPanel } from "../panels/XYChartPanel";
import { API_BASE_URL } from "@/lib/api";

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
  { id: "histogram", name: "Histogram", icon: "📊" },
  { id: "xychart", name: "XY Chart", icon: "📉" },
];

const CHART_COLORS = [
  "#7EB26D", // green
  "#EAB839", // yellow
  "#6ED0E0", // light blue
  "#EF843C", // orange
  "#E24D42", // red
  "#1F78C1", // blue
  "#BA43A9", // purple
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
  const [barChartOptions, setBarChartOptions] = useState<{
    layout: "horizontal" | "vertical";
    stacking: "none" | "normal" | "percent";
    xAxisKey?: string;
    xTickLabelRotation: number;
    showValues: "auto" | "always" | "never";
    barWidth: number;
    barRadius: number;
  }>({ 
    layout: "vertical", 
    stacking: "none", 
    xTickLabelRotation: 0,
    showValues: "auto",
    barWidth: 0.8,
    barRadius: 2
  });
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
      if (editingPanel.type === "barchart") {
        setBarChartOptions({
          layout: editingPanel.options?.layout || "vertical",
          stacking: editingPanel.options?.stacking || "none",
          xAxisKey: editingPanel.options?.xAxisKey,
          xTickLabelRotation: editingPanel.options?.xTickLabelRotation || 0,
          showValues: editingPanel.options?.showValues || "auto",
          barWidth: editingPanel.options?.barWidth || 0.6,
          barRadius: editingPanel.options?.barRadius || 0,
        });
      }
      // Map rawSql to expr for SQL panels if expr is missing
      const mappedTargets = (editingPanel.targets || []).map(t => {
        let dsId = t.datasource;
        
        // Handle datasource mapping
        if (!dsId) {
          if (editingPanel.datasource) {
            if (typeof editingPanel.datasource === 'object') {
              // If it's a postgres type, map to our local 'postgres' datasource id
              if ((editingPanel.datasource as any).type === 'postgres') {
                dsId = 'postgres';
              } else {
                dsId = (editingPanel.datasource as any).uid;
              }
            } else {
              dsId = editingPanel.datasource;
            }
          } else {
            dsId = "prometheus";
          }
        }

        return {
          ...t,
          expr: t.expr || t.rawSql || "",
          queryMode: t.queryMode || "code",
          datasource: dsId
        };
      });
      
      setQueries(mappedTargets.length > 0 ? mappedTargets : [{ refId: "A", expr: "", datasource: editingPanel.datasource?.uid || "prometheus", queryMode: "code" }]);
      
      // Initialize query result if available
      if (editingPanel.options?.queryResult) {
        setQueryResult(editingPanel.options.queryResult);
      }
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
      const response = await fetch(`${API_BASE_URL}/query/test`, {
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
          const response = await fetch(`${API_BASE_URL}/query/test`, {
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
    const panelUpdates = {
      title,
      description,
      type: vizType as PanelConfig["type"],
      targets: queries.map(q => ({
        ...q,
        rawSql: q.expr, // Ensure rawSql is synced with expr for SQL panels
      })),
      options: {
        ...(editingPanel?.options || {}),
        queryResult: queryResult || editingPanel?.options?.queryResult,
        ...(vizType === "barchart" ? {
           layout: barChartOptions.layout,
           stacking: barChartOptions.stacking,
           xAxisKey: barChartOptions.xAxisKey,
           xTickLabelRotation: barChartOptions.xTickLabelRotation,
           showValues: barChartOptions.showValues,
           barWidth: barChartOptions.barWidth,
           barRadius: barChartOptions.barRadius,
        } : {})
      },
    };

    // Check if editing existing panel (already in panels array) or creating new panel
    const isExistingPanel = editingPanel && panels.some(p => p.id === editingPanel.id);

    if (isExistingPanel && editingPanel) {
      console.log('Updating panel:', editingPanel.id, 'with queries:', queries);
      updatePanel(editingPanel.id, panelUpdates);
      toast.success("Panel updated");
    } else {
      const panelId = editingPanel?.id || `panel-${Date.now()}`;
      const newPanel: PanelConfig = {
        id: panelId,
        ...panelUpdates,
        gridPos: editingPanel?.gridPos || { x: 0, y: 0, w: 6, h: 4 },
      };
      console.log('Adding new panel:', newPanel.id, 'Title:', title, 'with query result:', queryResult);
      addPanel(newPanel);
      toast.success("Panel added to dashboard");
    }
    
    setShowPanelEditor(false);
    setEditingPanel(null);
    setSelectedVizType(null);
    
    if (dashboardState.isNew) {
      setTimeout(() => {
        setShowSaveDashboardModal(true);
      }, 200);
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
    // Common props for all panels
    const commonProps = {
      title: title || "Panel Title",
      panelId: "preview-panel",
      queryResult: queryResult,
    };

    switch (vizType) {
      case "timeseries":
        return (
          <TimeSeriesPanel
            {...commonProps}
            data={previewData}
            dataKeys={[
              { key: "value", color: CHART_COLORS[0], name: "Value" },
              { key: "value2", color: CHART_COLORS[1], name: "Value 2" },
            ]}
          />
        );
      case "stat":
        return (
          <StatPanel
            {...commonProps}
            value={queryResult?.rows?.[0]?.[0] || 75}
            unit="%"
            subtitle="Average CPU"
            trend="up"
            trendValue="12%"
            sparklineData={[30, 40, 35, 50, 49, 60, 70, 91, 125]}
          />
        );
      case "gauge":
        return (
          <GaugePanel
            {...commonProps}
            value={queryResult?.rows?.[0]?.[0] || 65}
            unit="%"
          />
        );
      case "barchart":
        return (
          <BarChartPanel
            {...commonProps}
            data={previewData.slice(0, 8)}
            layout={barChartOptions.layout}
            stacking={barChartOptions.stacking}
            xAxisKey={barChartOptions.xAxisKey}
            xTickLabelRotation={barChartOptions.xTickLabelRotation}
            showValues={barChartOptions.showValues}
            barWidth={barChartOptions.barWidth}
            barRadius={barChartOptions.barRadius}
          />
        );
      case "table":
        return (
          <TablePanel
            {...commonProps}
            data={previewData}
            columns={[
              { key: "time", label: "Time" },
              { key: "value", label: "Value" },
              { key: "value2", label: "Value 2" },
            ]}
          />
        );
      case "piechart":
        return (
          <PieChartPanel
            {...commonProps}
            data={pieData}
          />
        );
      case "alertlist":
        return (
          <AlertListPanel
            {...commonProps}
            alerts={[
              { name: "High CPU", state: "firing", severity: "critical", message: "CPU > 90%", time: "2m ago" },
              { name: "Memory Warning", state: "pending", severity: "warning", message: "Memory > 80%", time: "5m ago" },
            ]}
          />
        );
      case "histogram":
        return (
          <HistogramPanel
            {...commonProps}
            data={previewData}
            dataKeys={[
              { key: "value", color: CHART_COLORS[0], name: "Value" },
              { key: "value2", color: CHART_COLORS[1], name: "Value 2" },
            ]}
          />
        );
      case "xychart":
        return (
          <XYChartPanel
            {...commonProps}
            data={previewData}
            dataKeys={[
              { key: "value", color: CHART_COLORS[0], name: "Value" },
              { key: "value2", color: CHART_COLORS[1], name: "Value 2" },
            ]}
          />
        );
      case "logs":
        return (
          <LogsPanel
            {...commonProps}
            logs={[
              { timestamp: "12:00:01", level: "info", message: "Started processing", labels: { service: "api" } },
              { timestamp: "12:00:02", level: "error", message: "Connection failed", labels: { service: "db" } },
            ]}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Visualization not implemented yet
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
          <div className="h-1/2 border-b border-border bg-secondary/10 p-4">
            <div className="h-full w-full">
               {renderPreview()}
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
                <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1">
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

              {vizType === "barchart" && (
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium text-foreground mb-3">Bar chart</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">X Axis</label>
                      <select 
                        className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={barChartOptions.xAxisKey || ""}
                        onChange={(e) => setBarChartOptions({...barChartOptions, xAxisKey: e.target.value || undefined})}
                      >
                        <option value="">Auto</option>
                        {queryResult?.columns?.map((col: string) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Orientation</label>
                      <div className="flex bg-input rounded border border-border p-1">
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.layout === "horizontal" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, layout: "horizontal"})}
                        >
                          Horizontal
                        </button>
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.layout === "vertical" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, layout: "vertical"})}
                        >
                          Vertical
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Rotate x-axis tick labels</label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="range" 
                           min="-90" 
                           max="90" 
                           step="15"
                           value={barChartOptions.xTickLabelRotation}
                           onChange={(e) => setBarChartOptions({...barChartOptions, xTickLabelRotation: Number(e.target.value)})}
                           className="flex-1"
                         />
                         <input 
                           type="number" 
                           value={barChartOptions.xTickLabelRotation}
                           onChange={(e) => setBarChartOptions({...barChartOptions, xTickLabelRotation: Number(e.target.value)})}
                           className="w-16 px-2 py-1 bg-input border border-border rounded text-sm text-center"
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm text-muted-foreground">Show values</label>
                       <div className="flex bg-input rounded border border-border p-1">
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.showValues === "auto" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, showValues: "auto"})}
                        >
                          Auto
                        </button>
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.showValues === "always" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, showValues: "always"})}
                        >
                          Always
                        </button>
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.showValues === "never" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, showValues: "never"})}
                        >
                          Never
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Stacking</label>
                      <div className="flex bg-input rounded border border-border p-1">
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.stacking === "none" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, stacking: "none"})}
                        >
                          Off
                        </button>
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.stacking === "normal" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, stacking: "normal"})}
                        >
                          Normal
                        </button>
                        <button
                          className={cn("flex-1 text-xs py-1 rounded transition-colors", barChartOptions.stacking === "percent" ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}
                          onClick={() => setBarChartOptions({...barChartOptions, stacking: "percent"})}
                        >
                          100%
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm text-muted-foreground">Bar width ({(barChartOptions.barWidth * 100).toFixed(0)}%)</label>
                       <input 
                         type="range" 
                         min="0.1" 
                         max="1.0" 
                         step="0.05"
                         value={barChartOptions.barWidth}
                         onChange={(e) => setBarChartOptions({...barChartOptions, barWidth: Number(e.target.value)})}
                         className="w-full"
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-sm text-muted-foreground">Bar radius ({barChartOptions.barRadius}px)</label>
                       <input 
                         type="range" 
                         min="0" 
                         max="20" 
                         step="1"
                         value={barChartOptions.barRadius}
                         onChange={(e) => setBarChartOptions({...barChartOptions, barRadius: Number(e.target.value)})}
                         className="w-full"
                       />
                    </div>
                  </div>
                </div>
              )}

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