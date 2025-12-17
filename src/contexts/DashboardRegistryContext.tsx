import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { PanelConfig, DashboardState } from "./DashboardContext";

export interface DashboardFolder {
  id: string;
  uid: string;
  title: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardEntry {
  id: string;
  uid: string;
  title: string;
  tags: string[];
  folderId: string | null; // null means root/General
  folder: string; // Display name for backwards compatibility
  panels: PanelConfig[];
  time: { from: string; to: string };
  refresh: string;
  starred: boolean;
  version: number;
  isNew: boolean;
  isDirty: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardRegistryContextType {
  dashboards: DashboardEntry[];
  folders: DashboardFolder[];
  activeDashboardId: string | null;
  
  // Dashboard CRUD
  createNewDashboard: () => string;
  openDashboard: (id: string) => void;
  saveDashboard: (id: string, title?: string, folder?: string, tags?: string[]) => void;
  discardDashboard: (id: string) => void;
  deleteDashboard: (id: string) => void;
  moveDashboard: (dashboardId: string, folderId: string | null) => void;
  
  // Folder CRUD
  createFolder: (title: string, parentId?: string | null) => string;
  renameFolder: (id: string, title: string) => void;
  deleteFolder: (id: string) => void;
  getFolder: (id: string) => DashboardFolder | null;
  getDashboardsInFolder: (folderId: string | null) => DashboardEntry[];
  
  // Get dashboard
  getActiveDashboard: () => DashboardEntry | null;
  getDashboard: (id: string) => DashboardEntry | null;
  
  // Update dashboard
  updateDashboardPanels: (id: string, panels: PanelConfig[]) => void;
  markDashboardDirty: (id: string) => void;
  
  // Check for unsaved drafts
  hasUnsavedDraft: () => boolean;
  getUnsavedDraft: () => DashboardEntry | null;
}

const DashboardRegistryContext = createContext<DashboardRegistryContextType | undefined>(undefined);

// Initial folders
const initialFolders: DashboardFolder[] = [
  {
    id: "folder-infrastructure",
    uid: "inf-001",
    title: "Infrastructure",
    parentId: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "folder-applications",
    uid: "app-001",
    title: "Applications",
    parentId: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Sample saved dashboards
const initialDashboards: DashboardEntry[] = [
  {
    id: "system-monitoring",
    uid: "sys-mon-001",
    title: "System Monitoring",
    tags: ["monitoring", "system"],
    folderId: null,
    folder: "General",
    panels: [],
    time: { from: "now-6h", to: "now" },
    refresh: "Off",
    starred: true,
    version: 1,
    isNew: false,
    isDirty: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-12-08"),
  },
  {
    id: "network-overview",
    uid: "net-ovr-001",
    title: "Network Overview",
    tags: ["network", "infrastructure"],
    folderId: "folder-infrastructure",
    folder: "Infrastructure",
    panels: [],
    time: { from: "now-1h", to: "now" },
    refresh: "30s",
    starred: false,
    version: 3,
    isNew: false,
    isDirty: false,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-12-07"),
  },
];

export function DashboardRegistryProvider({ children }: { children: ReactNode }) {
  const [dashboards, setDashboards] = useState<DashboardEntry[]>(initialDashboards);
  const [folders, setFolders] = useState<DashboardFolder[]>(initialFolders);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);

  const generateId = () => `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const generateUid = () => `d${Math.random().toString(36).substr(2, 8)}`;
  const generateFolderId = () => `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const hasUnsavedDraft = useCallback(() => {
    return dashboards.some(d => d.isNew);
  }, [dashboards]);

  const getUnsavedDraft = useCallback(() => {
    return dashboards.find(d => d.isNew) || null;
  }, [dashboards]);

  const createNewDashboard = useCallback(() => {
    const existingDraft = dashboards.find(d => d.isNew);
    if (existingDraft) {
      setActiveDashboardId(existingDraft.id);
      return existingDraft.id;
    }

    const newId = generateId();
    const newDashboard: DashboardEntry = {
      id: newId,
      uid: generateUid(),
      title: "New Dashboard",
      tags: [],
      folderId: null,
      folder: "General",
      panels: [],
      time: { from: "now-6h", to: "now" },
      refresh: "Off",
      starred: false,
      version: 0,
      isNew: true,
      isDirty: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setDashboards(prev => [...prev, newDashboard]);
    setActiveDashboardId(newId);
    return newId;
  }, [dashboards]);

  const openDashboard = useCallback((id: string) => {
    setActiveDashboardId(id);
  }, []);

  const saveDashboard = useCallback((id: string, title?: string, folder?: string, tags?: string[]) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== id) return d;
      return {
        ...d,
        title: title || d.title,
        folder: folder || d.folder,
        tags: tags || d.tags,
        isNew: false,
        isDirty: false,
        version: d.version + 1,
        updatedAt: new Date(),
      };
    }));
  }, []);

  const discardDashboard = useCallback((id: string) => {
    const dashboard = dashboards.find(d => d.id === id);
    if (!dashboard) return;

    if (dashboard.isNew) {
      setDashboards(prev => prev.filter(d => d.id !== id));
      if (activeDashboardId === id) {
        setActiveDashboardId(null);
      }
    } else {
      setDashboards(prev => prev.map(d => 
        d.id === id ? { ...d, isDirty: false } : d
      ));
    }
  }, [dashboards, activeDashboardId]);

  const deleteDashboard = useCallback((id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id));
    if (activeDashboardId === id) {
      setActiveDashboardId(null);
    }
  }, [activeDashboardId]);

  const moveDashboard = useCallback((dashboardId: string, folderId: string | null) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== dashboardId) return d;
      const folderName = folderId 
        ? folders.find(f => f.id === folderId)?.title || "General"
        : "General";
      return {
        ...d,
        folderId,
        folder: folderName,
        updatedAt: new Date(),
      };
    }));
  }, [folders]);

  // Folder CRUD
  const createFolder = useCallback((title: string, parentId: string | null = null) => {
    const newId = generateFolderId();
    const newFolder: DashboardFolder = {
      id: newId,
      uid: generateUid(),
      title,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newId;
  }, []);

  const renameFolder = useCallback((id: string, title: string) => {
    setFolders(prev => prev.map(f => 
      f.id === id ? { ...f, title, updatedAt: new Date() } : f
    ));
    // Update dashboard folder names
    setDashboards(prev => prev.map(d => 
      d.folderId === id ? { ...d, folder: title } : d
    ));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    // Move dashboards from deleted folder to General
    setDashboards(prev => prev.map(d => 
      d.folderId === id ? { ...d, folderId: null, folder: "General" } : d
    ));
    setFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  const getFolder = useCallback((id: string) => {
    return folders.find(f => f.id === id) || null;
  }, [folders]);

  const getDashboardsInFolder = useCallback((folderId: string | null) => {
    return dashboards.filter(d => d.folderId === folderId);
  }, [dashboards]);

  const getActiveDashboard = useCallback(() => {
    if (!activeDashboardId) return null;
    return dashboards.find(d => d.id === activeDashboardId) || null;
  }, [activeDashboardId, dashboards]);

  const getDashboard = useCallback((id: string) => {
    return dashboards.find(d => d.id === id) || null;
  }, [dashboards]);

  const updateDashboardPanels = useCallback((id: string, panels: PanelConfig[]) => {
    setDashboards(prev => prev.map(d => 
      d.id === id ? { ...d, panels, isDirty: true, updatedAt: new Date() } : d
    ));
  }, []);

  const markDashboardDirty = useCallback((id: string) => {
    setDashboards(prev => prev.map(d => 
      d.id === id ? { ...d, isDirty: true } : d
    ));
  }, []);

  return (
    <DashboardRegistryContext.Provider
      value={{
        dashboards,
        folders,
        activeDashboardId,
        createNewDashboard,
        openDashboard,
        saveDashboard,
        discardDashboard,
        deleteDashboard,
        moveDashboard,
        createFolder,
        renameFolder,
        deleteFolder,
        getFolder,
        getDashboardsInFolder,
        getActiveDashboard,
        getDashboard,
        updateDashboardPanels,
        markDashboardDirty,
        hasUnsavedDraft,
        getUnsavedDraft,
      }}
    >
      {children}
    </DashboardRegistryContext.Provider>
  );
}

export function useDashboardRegistry() {
  const context = useContext(DashboardRegistryContext);
  if (context === undefined) {
    throw new Error("useDashboardRegistry must be used within a DashboardRegistryProvider");
  }
  return context;
}
