import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useDashboard } from "@/contexts/DashboardContext";
import { useDashboardRegistry, DashboardFolder } from "@/contexts/DashboardRegistryContext";
import { FolderModal } from "./modals/FolderModal";
import { MoveDashboardModal } from "./modals/MoveDashboardModal";
import { toast } from "sonner";
import {
  Home,
  LayoutDashboard,
  Compass,
  Bell,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  HelpCircle,
  User,
  FolderPlus,
  FileUp,
  List,
  Play,
  Camera,
  Library,
  AlertTriangle,
  Phone,
  Shield,
  Volume2,
  Users as UsersIcon,
  Plug,
  Package,
  Building,
  Key,
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  action?: () => void;
  children?: { label: string; href?: string; action?: () => void; icon?: React.ElementType }[];
}

export function GrafanaSidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, setShowSearchModal } = useDashboard();
  const { createNewDashboard, folders, dashboards, getDashboardsInFolder, deleteFolder, deleteDashboard } = useDashboardRegistry();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Dashboards"]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DashboardFolder | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingDashboard, setMovingDashboard] = useState<any>(null);
  const [savedDashboards, setSavedDashboards] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Load saved dashboards from localStorage
  useEffect(() => {
    const loadSavedDashboards = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
        setSavedDashboards(saved);
      } catch {
        setSavedDashboards([]);
      }
    };
    
    loadSavedDashboards();
    
    const handleStorageChange = () => {
      loadSavedDashboards();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleNewDashboard = () => {
    const newId = createNewDashboard();
    navigate(`/dashboard/${newId}`);
  };

  const handleNewFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleEditFolder = (folder: DashboardFolder) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
  };

  const handleDeleteDashboard = (dashboard: any) => {
    // 1. Delete from registry (in-memory)
    deleteDashboard(dashboard.id);
    
    // 2. Delete from localStorage
    const saved = JSON.parse(localStorage.getItem('grafana-dashboards') || '[]');
    const filtered = saved.filter((d: any) => d.id !== dashboard.id);
    localStorage.setItem('grafana-dashboards', JSON.stringify(filtered));
    
    // 3. Trigger update
    window.dispatchEvent(new Event('storage'));
    
    toast.success(`Dashboard "${dashboard.title}" deleted`);
    
    // 4. Navigate away if current dashboard is deleted
    if (location.pathname === `/dashboard/${dashboard.id}`) {
      navigate('/dashboards');
    }
  };

  const handleMoveDashboard = (dashboard: any) => {
    setMovingDashboard(dashboard);
    setShowMoveModal(true);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const generalDashboards = getDashboardsInFolder(null);
  
  // Memoize expensive calculations
  const { savedDashboardsByFolder, allFolderNames } = useMemo(() => {
    const byFolder = savedDashboards.reduce((acc, dashboard) => {
      const folder = dashboard.folder || 'General';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(dashboard);
      return acc;
    }, {} as Record<string, any[]>);
    
    const folderNames = [...new Set([...Object.keys(byFolder), 'General'])];
    
    return { savedDashboardsByFolder: byFolder, allFolderNames: folderNames };
  }, [savedDashboards]);

  const menuItems: SidebarItem[] = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Star, label: "Starred", href: "/starred" },
    { 
      icon: LayoutDashboard, 
      label: "Dashboards", 
      href: "/dashboards",
      children: [
        { label: "Browse", href: "/dashboards", icon: List },
        { label: "Playlists", href: "/dashboards/playlists", icon: Play },
        { label: "Snapshots", href: "/dashboards/snapshots", icon: Camera },
        { label: "Library panels", href: "/dashboards/library", icon: Library },
        { label: "New dashboard", action: handleNewDashboard, icon: LayoutDashboard },
        { label: "New folder", action: handleNewFolder, icon: FolderPlus },
        { label: "Import", href: "/dashboards/import", icon: FileUp },
      ]
    },
    { icon: Compass, label: "Explore", href: "/explore" },
    { 
      icon: Bell, 
      label: "Alerting",
      href: "/alerting",
      children: [
        { label: "Alert rules", href: "/alerting/rules", icon: AlertTriangle },
        { label: "Contact points", href: "/alerting/contacts", icon: Phone },
        { label: "Notification policies", href: "/alerting/policies", icon: Shield },
        { label: "Silences", href: "/alerting/silences", icon: Volume2 },
        { label: "Alert groups", href: "/alerting/groups", icon: UsersIcon },
      ]
    },
    { 
      icon: Database, 
      label: "Connections",
      href: "/connections",
      children: [
        { label: "Data sources", href: "/connections/datasources", icon: Database },
        { label: "Plugins", href: "/connections/plugins", icon: Plug },
      ]
    },
  ];

  const adminItems: SidebarItem[] = [
    { 
      icon: Settings, 
      label: "Administration",
      href: "/admin",
      children: [
        { label: "General", href: "/admin/general", icon: Settings },
        { label: "Plugins", href: "/admin/plugins", icon: Package },
        { label: "Users", href: "/admin/users", icon: UsersIcon },
        { label: "Teams", href: "/admin/teams", icon: Building },
        { label: "Service accounts", href: "/admin/service-accounts", icon: Key },
      ]
    },
  ];

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(i => i !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setShowSearchModal]);

  const handleNavigation = (item: SidebarItem) => {
    if (item.children) {
      toggleExpanded(item.label);
    }
    if (item.href) {
      navigate(item.href);
    }
    if (item.action) {
      item.action();
    }
  };

  const handleChildClick = (child: { href?: string; action?: () => void }) => {
    if (child.action) {
      child.action();
    } else if (child.href) {
      navigate(child.href);
    }
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 flex-shrink-0",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded bg-grafana-orange flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <span className="font-semibold text-foreground">Grafana</span>
          </button>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Search */}
      {!sidebarCollapsed && (
        <div className="p-3">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-input rounded border border-border text-muted-foreground text-sm hover:border-primary/50 transition-colors"
          >
            <Search size={16} />
            <span>Search or jump to...</span>
            <kbd className="ml-auto text-xs bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
      )}

      {sidebarCollapsed && (
        <div className="p-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground transition-colors flex justify-center"
            title="Search (⌘K)"
          >
            <Search size={20} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => handleNavigation(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon size={20} className={isActive(item.href) ? "text-primary" : ""} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "transition-transform",
                          expandedItems.includes(item.label) && "rotate-90"
                        )}
                      />
                    )}
                  </>
                )}
              </button>
              {!sidebarCollapsed && item.children && expandedItems.includes(item.label) && (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
                  {item.children.map((child) => (
                    <li key={child.label}>
                      <button
                        onClick={() => handleChildClick(child)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors",
                          child.href && location.pathname === child.href
                            ? "text-primary bg-sidebar-accent/50"
                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        {child.icon && <child.icon size={14} />}
                        {child.label}
                      </button>
                    </li>
                  ))}

                  {/* Folders section when Dashboards is expanded */}
                  {item.label === "Dashboards" && (
                    <>
                      <li className="pt-2">
                        <span className="text-xs text-muted-foreground px-3">FOLDERS</span>
                      </li>
                      
                      {/* All folders including saved dashboards */}
                      {allFolderNames.map(folderName => {
                        const registryDashboards = folderName === 'General' ? generalDashboards : [];
                        const savedFolderDashboards = savedDashboardsByFolder[folderName] || [];
                        
                        // Deduplicate: prefer saved dashboards over registry ones
                        const savedIds = new Set(savedFolderDashboards.map(d => d.id));
                        const uniqueRegistry = registryDashboards.filter(d => !savedIds.has(d.id));
                        const allDashboardsInFolder = [...uniqueRegistry, ...savedFolderDashboards];
                        
                        if (allDashboardsInFolder.length === 0) return null;
                        
                        return (
                          <li key={`folder-${folderName}`}>
                            <div className="flex items-center group">
                              <button
                                onClick={() => toggleFolder(folderName.toLowerCase())}
                                className="flex-1 flex items-center gap-2 px-3 py-1.5 text-sm rounded-l transition-colors text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                              >
                                <Folder size={14} />
                                <span>{folderName}</span>
                                <span className="text-xs text-muted-foreground ml-1">({allDashboardsInFolder.length})</span>
                                <ChevronRight
                                  size={12}
                                  className={cn(
                                    "ml-auto transition-transform",
                                    expandedFolders.includes(folderName.toLowerCase()) && "rotate-90"
                                  )}
                                />
                              </button>
                            </div>
                            {expandedFolders.includes(folderName.toLowerCase()) && (
                              <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
                                {allDashboardsInFolder.map((dash) => (
                                  <li key={`dash-${dash.id}`} className="flex items-center group">
                                    <button
                                      onClick={() => navigate(`/dashboard/${dash.id}`)}
                                      className="flex-1 flex items-center gap-2 px-2 py-1 text-xs rounded-l transition-colors text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50 truncate"
                                    >
                                      <LayoutDashboard size={12} />
                                      <span className="truncate">{dash.title}</span>
                                    </button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent rounded transition-all">
                                          <MoreVertical size={12} />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="bg-popover border-border z-50" align="end">
                                        <DropdownMenuItem onClick={() => handleMoveDashboard(dash)}>
                                          <ArrowRight size={14} className="mr-2" />
                                          Move to folder
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteDashboard(dash)} className="text-destructive focus:text-destructive">
                                          <Trash2 size={14} className="mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}

                      {/* Custom folders */}
                      {folders.map((folder) => {
                        const folderDashboards = getDashboardsInFolder(folder.id);
                        return (
                          <li key={folder.id}>
                            <div className="flex items-center group">
                              <button
                                onClick={() => toggleFolder(folder.id)}
                                className="flex-1 flex items-center gap-2 px-3 py-1.5 text-sm rounded-l transition-colors text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                              >
                                <Folder size={14} />
                                <span className="truncate">{folder.title}</span>
                                <span className="text-xs text-muted-foreground ml-1">({folderDashboards.length})</span>
                                <ChevronRight
                                  size={12}
                                  className={cn(
                                    "ml-auto transition-transform",
                                    expandedFolders.includes(folder.id) && "rotate-90"
                                  )}
                                />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent rounded transition-all">
                                    <MoreVertical size={14} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-popover border-border z-50" align="end">
                                  <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                                    <Pencil size={14} className="mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFolder(folder.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {expandedFolders.includes(folder.id) && folderDashboards.length > 0 && (
                              <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
                                {folderDashboards.map((dash) => (
                                  <li key={`custom-dash-${dash.id}`} className="flex items-center group">
                                    <button
                                      onClick={() => navigate(`/dashboard/${dash.id}`)}
                                      className="flex-1 flex items-center gap-2 px-2 py-1 text-xs rounded-l transition-colors text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50 truncate"
                                    >
                                      <LayoutDashboard size={12} />
                                      <span className="truncate">{dash.title}</span>
                                    </button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent rounded transition-all">
                                          <MoreVertical size={12} />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="bg-popover border-border z-50" align="end">
                                        <DropdownMenuItem onClick={() => handleMoveDashboard(dash)}>
                                          <ArrowRight size={14} className="mr-2" />
                                          Move to folder
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteDashboard(dash)} className="text-destructive focus:text-destructive">
                                          <Trash2 size={14} className="mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="my-4 mx-4 border-t border-sidebar-border" />

        <ul className="space-y-0.5 px-2">
          {adminItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => handleNavigation(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon size={20} className={isActive(item.href) ? "text-primary" : ""} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.children && (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "transition-transform",
                          expandedItems.includes(item.label) && "rotate-90"
                        )}
                      />
                    )}
                  </>
                )}
              </button>
              {!sidebarCollapsed && item.children && expandedItems.includes(item.label) && (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
                  {item.children.map((child) => (
                    <li key={child.label}>
                      <button
                        onClick={() => handleChildClick(child)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors",
                          child.href && location.pathname === child.href
                            ? "text-primary bg-sidebar-accent/50"
                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        {child.icon && <child.icon size={14} />}
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-2">
        <button 
          onClick={() => window.open("https://grafana.com/docs/", "_blank")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <HelpCircle size={20} />
          {!sidebarCollapsed && <span>Help</span>}
        </button>
        <button 
          onClick={() => navigate("/admin/users")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-grafana-blue flex items-center justify-center">
            <User size={12} className="text-info-foreground" />
          </div>
          {!sidebarCollapsed && <span>Admin</span>}
        </button>
      </div>

      {/* Modals */}
      <FolderModal 
        isOpen={showFolderModal} 
        onClose={() => setShowFolderModal(false)} 
        editingFolder={editingFolder}
      />
      <MoveDashboardModal 
        isOpen={showMoveModal} 
        onClose={() => setShowMoveModal(false)} 
        dashboard={movingDashboard}
      />
    </aside>
  );
}
