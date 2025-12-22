import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

export interface PanelConfig {
  id: string;
  type: "timeseries" | "stat" | "gauge" | "barchart" | "table" | "alertlist" | "logs" | "piechart" | "text";
  title: string;
  gridPos: { x: number; y: number; w: number; h: number };
  options: Record<string, any>;
  targets?: QueryTarget[];
  description?: string;
  datasource?: DataSource;
  fieldConfig?: {
    defaults?: FieldConfig;
    overrides?: FieldOverride[];
  };
}

export interface FieldConfig {
  displayName?: string;
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
  color?: FieldColor;
  custom?: Record<string, any>;
  thresholds?: {
    mode: 'absolute' | 'percentage';
    steps: Array<{
      color: string;
      value: number | null;
    }>;
  };
}

export interface FieldOverride {
  matcher: {
    id: string;
    options?: any;
  };
  properties: Array<{
    id: string;
    value: any;
  }>;
}

export interface FieldColor {
  mode: 'palette-classic' | 'continuous-GrYlRd' | 'fixed' | 'thresholds';
  fixedColor?: string;
}

export interface QueryTarget {
  refId: string;
  expr?: string;
  datasource: string | DataSource;
  queryMode?: "builder" | "code";
  legendFormat?: string;
  // CSV-specific fields
  scenarioId?: 'csv_content' | 'csv_file' | 'csv_url';
  csvContent?: string;
  csvFileName?: string;
  csvUrl?: string;
  alias?: string;
  dropPercent?: number;
  labels?: string;
  // Generic query fields
  query?: string;
  rawSql?: string;
  format?: 'time_series' | 'table';
  intervalMs?: number;
  maxDataPoints?: number;
}

export interface VariableOption {
  text: string;
  value: string;
  selected?: boolean;
}

export interface DashboardVariable {
  name: string;
  label: string;
  type: "custom" | "query" | "datasource" | "interval" | "textbox" | "constant";
  current: string | string[];
  options: VariableOption[];
  query?: string;
  datasource?: string;
  multi?: boolean;
  includeAll?: boolean;
  allValue?: string;
  refresh?: "never" | "load" | "time";
}

export interface DataSource {
  id: string;
  name: string;
  type: "prometheus" | "loki" | "postgres" | "mysql" | "influxdb" | "elasticsearch" | "graphite" | "testdata" | "csv";
  isDefault?: boolean;
  url?: string;
  csvConfig?: {
    url?: string;
    filePath?: string;
    delimiter?: string;
    hasHeader?: boolean;
  };
}

export interface Dashboard {
  id: string;
  uid: string;
  title: string;
  tags: string[];
  panels: PanelConfig[];
  time: { from: string; to: string };
  refresh: string;
  starred: boolean;
  folderId?: string;
  version: number;
}

export interface DashboardState {
  isDirty: boolean;
  isNew: boolean;
  lastSaved?: Date;
  originalPanels: PanelConfig[];
}

interface DashboardContextType {
  // Time and refresh
  timeRange: string;
  setTimeRange: (range: string) => void;
  refreshInterval: string;
  setRefreshInterval: (interval: string) => void;
  isRefreshing: boolean;
  triggerRefresh: () => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Modals
  showSearchModal: boolean;
  setShowSearchModal: (show: boolean) => void;
  showAddPanelModal: boolean;
  setShowAddPanelModal: (show: boolean) => void;
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  showPanelEditor: boolean;
  setShowPanelEditor: (show: boolean) => void;
  showDataSourceSelector: boolean;
  setShowDataSourceSelector: (show: boolean) => void;
  showSaveDashboardModal: boolean;
  setShowSaveDashboardModal: (show: boolean) => void;
  showCSVImportModal: boolean;
  setShowCSVImportModal: (show: boolean) => void;
  showJSONModal: boolean;
  setShowJSONModal: (show: boolean) => void;
  
  // Panel editing
  editingPanel: PanelConfig | null;
  setEditingPanel: (panel: PanelConfig | null) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Dashboard metadata
  dashboardTitle: string;
  setDashboardTitle: (title: string) => void;
  isStarred: boolean;
  setIsStarred: (starred: boolean) => void;
  dashboardFolder: string;
  setDashboardFolder: (folder: string) => void;
  dashboardTags: string[];
  setDashboardTags: (tags: string[]) => void;
  
  // Panels
  panels: PanelConfig[];
  setPanels: (panels: PanelConfig[]) => void;
  addPanel: (panel: PanelConfig) => void;
  updatePanel: (id: string, updates: Partial<PanelConfig>) => void;
  removePanel: (id: string) => void;
  duplicatePanel: (id: string) => void;
  movePanel: (id: string, direction: "up" | "down" | "left" | "right") => void;
  reorderPanels: (startIndex: number, endIndex: number) => void;
  
  // Edit mode
  isEditMode: boolean;
  setIsEditMode: (edit: boolean) => void;
  
  // Dashboard state
  dashboardState: DashboardState;
  setDashboardState: (state: DashboardState) => void;
  markDirty: () => void;
  saveDashboard: (options?: { title?: string; folder?: string; tags?: string[] }) => void;
  discardChanges: () => void;
  
  // Data sources
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  setSelectedDataSource: (ds: DataSource | null) => void;
  
  // Variables (legacy)
  variables: Record<string, string>;
  setVariables: (vars: Record<string, string>) => void;
  
  // Dashboard Variables (new templating system)
  dashboardVariables: DashboardVariable[];
  setDashboardVariables: (vars: DashboardVariable[]) => void;
  variableValues: Record<string, string | string[]>;
  setVariableValue: (name: string, value: string | string[]) => void;
  showVariablesModal: boolean;
  setShowVariablesModal: (show: boolean) => void;
  
  // Data refresh
  dataRefreshKey: number;
  
  // Visualization selection
  selectedVizType: string | null;
  setSelectedVizType: (type: string | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const defaultDataSources: DataSource[] = [
  { id: "prometheus", name: "Prometheus", type: "prometheus", isDefault: true },
  { id: "loki", name: "Loki", type: "loki" },
  { id: "postgres", name: "PostgreSQL", type: "postgres" },
  { id: "mysql", name: "MySQL", type: "mysql" },
  { id: "influxdb", name: "InfluxDB", type: "influxdb" },
  { id: "elasticsearch", name: "Elasticsearch", type: "elasticsearch" },
  { id: "csv", name: "CSV Data Source", type: "csv" },
  { id: "testdata", name: "TestData", type: "testdata" },
];

const defaultPanels: PanelConfig[] = [
  {
    id: "cpu-stat",
    type: "stat",
    title: "CPU Usage",
    gridPos: { x: 0, y: 0, w: 3, h: 2 },
    options: { value: 72, unit: "%", color: "orange", trend: "up", trendValue: "+5%", sparklineData: [40, 45, 42, 55, 60, 58, 65, 70, 68, 72] },
  },
  {
    id: "memory-stat",
    type: "stat",
    title: "Memory Usage",
    gridPos: { x: 3, y: 0, w: 3, h: 2 },
    options: { value: 64, unit: "%", color: "blue", trend: "neutral", trendValue: "0%", sparklineData: [60, 62, 61, 63, 64, 63, 65, 64, 63, 64] },
  },
  {
    id: "users-stat",
    type: "stat",
    title: "Active Users",
    gridPos: { x: 6, y: 0, w: 3, h: 2 },
    options: { value: "12.4k", color: "green", trend: "up", trendValue: "+12%", sparklineData: [80, 85, 82, 88, 90, 92, 95, 93, 97, 100] },
  },
  {
    id: "error-stat",
    type: "stat",
    title: "Error Rate",
    gridPos: { x: 9, y: 0, w: 3, h: 2 },
    options: { value: 0.23, unit: "%", color: "red", trend: "down", trendValue: "-0.05%", sparklineData: [35, 32, 30, 28, 25, 27, 24, 23, 24, 23] },
  },
  {
    id: "system-metrics",
    type: "timeseries",
    title: "System Metrics",
    gridPos: { x: 0, y: 2, w: 8, h: 4 },
    options: {},
    targets: [
      { refId: "A", expr: "cpu_usage", datasource: "prometheus" },
      { refId: "B", expr: "memory_usage", datasource: "prometheus" },
    ],
  },
  {
    id: "alerts",
    type: "alertlist",
    title: "Active Alerts",
    gridPos: { x: 8, y: 2, w: 4, h: 4 },
    options: {},
  },
  {
    id: "cpu-gauge",
    type: "gauge",
    title: "CPU Load Average",
    gridPos: { x: 0, y: 6, w: 4, h: 3 },
    options: { value: 72 },
  },
  {
    id: "memory-gauge",
    type: "gauge",
    title: "Memory Pressure",
    gridPos: { x: 4, y: 6, w: 4, h: 3 },
    options: { value: 64 },
  },
  {
    id: "disk-gauge",
    type: "gauge",
    title: "Disk Usage",
    gridPos: { x: 8, y: 6, w: 4, h: 3 },
    options: { value: 45 },
  },
  {
    id: "top-endpoints",
    type: "barchart",
    title: "Top Endpoints by Requests",
    gridPos: { x: 0, y: 9, w: 6, h: 3 },
    options: { layout: "horizontal" },
  },
  {
    id: "service-status",
    type: "table",
    title: "Service Status",
    gridPos: { x: 6, y: 9, w: 6, h: 3 },
    options: {},
  },
  {
    id: "logs",
    type: "logs",
    title: "Recent Logs",
    gridPos: { x: 0, y: 12, w: 12, h: 3 },
    options: {},
  },
];

interface DashboardProviderProps {
  children: ReactNode;
  initialTitle?: string;
  initialFolder?: string;
  initialTags?: string[];
  initialPanels?: PanelConfig[];
  isNewDashboard?: boolean;
  dashboardId?: string;
  initialEditMode?: boolean;
}

export function DashboardProvider({ 
  children,
  initialTitle = "New Dashboard",
  initialFolder = "General",
  initialTags = [],
  initialPanels,
  isNewDashboard = false,
  dashboardId,
  initialEditMode = false,
}: DashboardProviderProps) {
  const [timeRange, setTimeRange] = useState("Last 6 hours");
  const [refreshInterval, setRefreshInterval] = useState("Off");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPanelEditor, setShowPanelEditor] = useState(false);
  const [showDataSourceSelector, setShowDataSourceSelector] = useState(false);
  const [showSaveDashboardModal, setShowSaveDashboardModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showJSONModal, setShowJSONModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState<PanelConfig | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState(initialTitle);
  const [isStarred, setIsStarred] = useState(false);
  const [dashboardFolder, setDashboardFolder] = useState(initialFolder);
  const [dashboardTags, setDashboardTags] = useState<string[]>(initialTags);
  
  // Use initialPanels if provided, otherwise use empty array for new dashboards or defaults
  const [panels, setPanels] = useState<PanelConfig[]>(() => {
    console.log('DashboardProvider initializing panels:', { initialPanels, isNewDashboard, initialPanelsLength: initialPanels?.length });
    if (initialPanels !== undefined) {
      console.log('Using initialPanels:', initialPanels);
      return initialPanels;
    }
    const fallback = isNewDashboard ? [] : defaultPanels;
    console.log('Using fallback panels:', fallback.length);
    return fallback;
  });
  
  console.log('DashboardProvider - Current panels state:', panels, 'length:', panels?.length);
  const [isEditMode, setIsEditMode] = useState(initialEditMode || isNewDashboard); // Use initialEditMode or auto-enter for new dashboards
  const [variables, setVariables] = useState<Record<string, string>>({ env: "production", region: "us-east-1" });
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(defaultDataSources[0]);
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [selectedVizType, setSelectedVizType] = useState<string | null>(null);
  
  // Dashboard Variables (templating system)
  const [dashboardVariables, setDashboardVariables] = useState<DashboardVariable[]>([
    {
      name: "environment",
      label: "Environment",
      type: "custom",
      current: "production",
      options: [
        { text: "Production", value: "production", selected: true },
        { text: "Staging", value: "staging" },
        { text: "Development", value: "development" },
      ],
      multi: false,
      includeAll: false,
    },
    {
      name: "region",
      label: "Region",
      type: "custom",
      current: "us-east-1",
      options: [
        { text: "US East 1", value: "us-east-1", selected: true },
        { text: "US West 2", value: "us-west-2" },
        { text: "EU West 1", value: "eu-west-1" },
        { text: "AP Southeast 1", value: "ap-southeast-1" },
      ],
      multi: false,
      includeAll: true,
    },
  ]);
  
  const [variableValues, setVariableValues] = useState<Record<string, string | string[]>>({
    environment: "production",
    region: "us-east-1",
  });
  
  const setVariableValue = useCallback((name: string, value: string | string[]) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
    // Trigger data refresh when variables change
    setDataRefreshKey(prev => prev + 1);
  }, []);
  
  const [dashboardState, setDashboardState] = useState<DashboardState>(() => ({
    isDirty: false,
    isNew: isNewDashboard,
    originalPanels: initialPanels !== undefined ? initialPanels : (isNewDashboard ? [] : defaultPanels),
    lastSaved: isNewDashboard ? undefined : new Date(),
  }));

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setDataRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval === "Off") return;
    
    const intervalMs: Record<string, number> = {
      "5s": 5000,
      "10s": 10000,
      "30s": 30000,
      "1m": 60000,
      "5m": 300000,
      "15m": 900000,
      "30m": 1800000,
      "1h": 3600000,
    };
    
    const ms = intervalMs[refreshInterval];
    if (!ms) return;
    
    const interval = setInterval(() => {
      triggerRefresh();
    }, ms);
    
    return () => clearInterval(interval);
  }, [refreshInterval, triggerRefresh]);

  const markDirty = useCallback(() => {
    setDashboardState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const addPanel = useCallback((panel: PanelConfig) => {
    console.log('addPanel called with:', panel.id, panel.type);
    console.log('Current panels before add:', panels.length);
    setPanels(prev => {
      const updated = [...prev, panel];
      console.log('Panels updated. Total panels:', updated.length);
      console.log('Updated panels array:', updated);
      return updated;
    });
    markDirty();
  }, [markDirty, panels.length]);

  const updatePanel = useCallback((id: string, updates: Partial<PanelConfig>) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    markDirty();
  }, [markDirty]);

  const removePanel = useCallback((id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
    markDirty();
  }, [markDirty]);

  const duplicatePanel = useCallback((id: string) => {
    setPanels(prev => {
      const panel = prev.find(p => p.id === id);
      if (!panel) return prev;
      const newPanel = {
        ...panel,
        id: `${panel.id}-copy-${Date.now()}`,
        title: `${panel.title} (copy)`,
        gridPos: { ...panel.gridPos, y: panel.gridPos.y + panel.gridPos.h },
      };
      return [...prev, newPanel];
    });
    markDirty();
  }, [markDirty]);

  const movePanel = useCallback((id: string, direction: "up" | "down" | "left" | "right") => {
    setPanels(prev => {
      return prev.map(panel => {
        if (panel.id !== id) return panel;
        const newGridPos = { ...panel.gridPos };
        switch (direction) {
          case "up": newGridPos.y = Math.max(0, newGridPos.y - 1); break;
          case "down": newGridPos.y += 1; break;
          case "left": newGridPos.x = Math.max(0, newGridPos.x - 1); break;
          case "right": newGridPos.x = Math.min(11, newGridPos.x + 1); break;
        }
        return { ...panel, gridPos: newGridPos };
      });
    });
    markDirty();
  }, [markDirty]);

  const reorderPanels = useCallback((startIndex: number, endIndex: number) => {
    setPanels(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
    markDirty();
  }, [markDirty]);

  const saveDashboard = useCallback((options?: { title?: string; folder?: string; tags?: string[] }) => {
    // Generate unique ID if new dashboard
    const newDashboardId = dashboardState.isNew ? `dashboard-${Date.now()}` : (dashboardId || `dashboard-${Date.now()}`);
    
    const titleToSave = options?.title || dashboardTitle;
    const folderToSave = options?.folder || dashboardFolder;
    const tagsToSave = options?.tags || dashboardTags;

    console.log('Saving dashboard:', { id: newDashboardId, title: titleToSave, panelCount: panels.length });
    console.log('Panels being saved:', panels);

    // Save to localStorage for persistence
    const dashboardData = {
      id: newDashboardId,
      uid: newDashboardId,
      title: titleToSave,
      panels: [...panels], // Ensure we're saving a copy of the panels array
      tags: tagsToSave,
      folder: folderToSave,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      time: { from: timeRange, to: 'now' },
      refresh: refreshInterval,
      starred: isStarred,
      version: 1
    };
    
    console.log('Dashboard data to save:', dashboardData);
    
    const savedDashboards = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
    const existingIndex = savedDashboards.findIndex((d: any) => d.id === newDashboardId);
    
    if (existingIndex >= 0) {
      console.log('Updating existing dashboard at index:', existingIndex);
      savedDashboards[existingIndex] = dashboardData;
    } else {
      console.log('Creating new dashboard');
      savedDashboards.push(dashboardData);
    }
    
    localStorage.setItem('grafana-dashboards', JSON.stringify(savedDashboards));
    console.log('Dashboard saved to localStorage. Total dashboards:', savedDashboards.length);
    
    setDashboardState(prev => ({
      ...prev,
      isDirty: false,
      isNew: false,
      originalPanels: [...panels],
      lastSaved: new Date(),
    }));
    
    // Store dashboard ID for future reference
    if (dashboardState.isNew) {
      window.history.replaceState(null, '', `/dashboard/${newDashboardId}`);
    }
  }, [panels, dashboardTitle, dashboardTags, dashboardFolder, timeRange, refreshInterval, isStarred, dashboardState.isNew, dashboardId]);

  const discardChanges = useCallback(() => {
    setPanels(dashboardState.originalPanels);
    setDashboardState(prev => ({ ...prev, isDirty: false }));
  }, [dashboardState.originalPanels]);

  return (
    <DashboardContext.Provider
      value={{
        timeRange,
        setTimeRange,
        refreshInterval,
        setRefreshInterval,
        isRefreshing,
        triggerRefresh,
        searchQuery,
        setSearchQuery,
        showSearchModal,
        setShowSearchModal,
        showAddPanelModal,
        setShowAddPanelModal,
        showShareModal,
        setShowShareModal,
        showSettingsModal,
        setShowSettingsModal,
        showPanelEditor,
        setShowPanelEditor,
        showDataSourceSelector,
        setShowDataSourceSelector,
        showSaveDashboardModal,
        setShowSaveDashboardModal,
        showCSVImportModal,
        setShowCSVImportModal,
        showJSONModal,
        setShowJSONModal,
        editingPanel,
        setEditingPanel,
        sidebarCollapsed,
        setSidebarCollapsed,
        dashboardTitle,
        setDashboardTitle,
        isStarred,
        setIsStarred,
        dashboardFolder,
        setDashboardFolder,
        dashboardTags,
        setDashboardTags,
        panels,
        setPanels,
        addPanel,
        updatePanel,
        removePanel,
        duplicatePanel,
        movePanel,
        reorderPanels,
        isEditMode,
        setIsEditMode,
        dashboardState,
        setDashboardState,
        markDirty,
        saveDashboard,
        discardChanges,
        dataSources: defaultDataSources,
        selectedDataSource,
        setSelectedDataSource,
        variables,
        setVariables,
        dashboardVariables,
        setDashboardVariables,
        variableValues,
        setVariableValue,
        showVariablesModal,
        setShowVariablesModal,
        dataRefreshKey,
        selectedVizType,
        setSelectedVizType,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}