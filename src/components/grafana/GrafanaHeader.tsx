import { useState, useEffect } from "react";
import {
  Plus,
  Clock,
  RefreshCw,
  ChevronDown,
  Settings,
  Share2,
  Star,
  MoreVertical,
  Copy,
  Download,
  Trash2,
  Edit,
  Eye,
  Save,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeRanges = [
  "Last 5 minutes",
  "Last 15 minutes",
  "Last 30 minutes",
  "Last 1 hour",
  "Last 3 hours",
  "Last 6 hours",
  "Last 12 hours",
  "Last 24 hours",
  "Last 2 days",
  "Last 7 days",
  "Last 30 days",
];

const refreshIntervals = [
  { label: "Off", value: "Off" },
  { label: "5s", value: "5s" },
  { label: "10s", value: "10s" },
  { label: "30s", value: "30s" },
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
];

export function GrafanaHeader() {
  const {
    timeRange,
    setTimeRange,
    refreshInterval,
    setRefreshInterval,
    isRefreshing,
    triggerRefresh,
    isStarred,
    setIsStarred,
    dashboardTitle,
    setDashboardTitle,
    setShowShareModal,
    setShowSettingsModal,
    setShowSaveDashboardModal,
    setShowDataSourceSelector,
    setShowCSVImportModal,
    setShowJSONModal,
    isEditMode,
    setIsEditMode,
    panels,
    dashboardState,
    saveDashboard,
    discardChanges,
    setShowPanelEditor,
    setEditingPanel,
    setSelectedVizType,
  } = useDashboard();

  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showRefreshDropdown, setShowRefreshDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showVisualizationDropdown, setShowVisualizationDropdown] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(dashboardTitle);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.dropdown-container')) {
        setShowTimeDropdown(false);
        setShowRefreshDropdown(false);
        setShowMoreDropdown(false);
        setShowVisualizationDropdown(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleStarToggle = () => {
    setIsStarred(!isStarred);
    toast.success(isStarred ? "Removed from starred" : "Added to starred");
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleAddPanel = () => {
    // Show data source selector first (Grafana workflow)
    setShowDataSourceSelector(true);
  };

  const handleRefreshClick = () => {
    triggerRefresh();
    toast.success("Dashboard refreshed");
  };

  const handleExport = () => {
    const dashboardJson = JSON.stringify({
      title: dashboardTitle,
      panels,
      time: { from: timeRange },
      refresh: refreshInterval,
    }, null, 2);
    
    const blob = new Blob([dashboardJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboardTitle.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Dashboard exported as JSON");
    setShowMoreDropdown(false);
  };

  const handleDuplicate = () => {
    toast.success("Dashboard duplicated");
    setShowMoreDropdown(false);
  };

  const handleViewJSON = () => {
    setShowJSONModal(true);
    setShowMoreDropdown(false);
  };

  const handleTitleSave = () => {
    setDashboardTitle(editedTitle);
    setIsEditingTitle(false);
    toast.success("Dashboard title updated");
  };

  const handleSave = () => {
    setShowSaveDashboardModal(true);
  };

  const handleSelectVisualization = (vizType: string) => {
    setIsEditMode(true);
    setSelectedVizType(vizType);
    setEditingPanel(null);
    setShowPanelEditor(true);
    setShowVisualizationDropdown(false);
    toast.info(`Creating new ${vizType} panel`);
  };

  const handleEditModeToggle = () => {
    if (isEditMode && dashboardState.isDirty) {
      setShowSaveDashboardModal(true);
    } else {
      setIsEditMode(!isEditMode);
      if (!isEditMode) {
        toast.info("Edit mode enabled - click on panels to edit them");
      }
    }
  };

  const handleDiscardChanges = () => {
    if (dashboardState.isDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsEditMode(false);
    }
  };

  const confirmDiscard = () => {
    discardChanges();
    setIsEditMode(false);
    setShowDiscardConfirm(false);
    toast.info("Changes discarded");
  };

  return (
    <>
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStarToggle}
              className="p-1.5 rounded hover:bg-secondary transition-colors"
              title={isStarred ? "Remove from starred" : "Add to starred"}
            >
              <Star
                size={18}
                className={cn(
                  "transition-colors",
                  isStarred ? "fill-grafana-yellow text-grafana-yellow" : "text-muted-foreground"
                )}
              />
            </button>
            
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-2 py-1 bg-input border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                />
                <button onClick={handleTitleSave} className="p-1 text-primary hover:bg-secondary rounded">
                  <Save size={16} />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1 text-muted-foreground hover:bg-secondary rounded">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setEditedTitle(dashboardTitle);
                  setIsEditingTitle(true);
                }}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
              >
                {dashboardTitle}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="grafana-badge grafana-badge-success">Production</span>
            {isEditMode && <span className="grafana-badge grafana-badge-warning">Editing</span>}
            {dashboardState.isDirty && (
              <span className="grafana-badge grafana-badge-error flex items-center gap-1">
                <AlertCircle size={10} />
                Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Edit mode buttons */}
          {isEditMode ? (
            <>
              <div className="relative dropdown-container">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVisualizationDropdown(!showVisualizationDropdown);
                  }}
                  className="grafana-btn grafana-btn-primary"
                  title="Add panel to dashboard"
                >
                  <Plus size={16} />
                  <span>Add</span>
                  <ChevronDown size={14} />
                </button>
                {showVisualizationDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in">
                    <button
                      onClick={() => {
                        setSelectedVizType('timeseries');
                        setEditingPanel(null);
                        setShowPanelEditor(true);
                        setShowVisualizationDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        📈
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Visualization</div>
                        <div className="text-xs text-muted-foreground">Add a new panel with a query</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        toast.info('Import from library - Coming soon');
                        setShowVisualizationDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <div className="w-8 h-8 bg-secondary/50 rounded flex items-center justify-center">
                        📚
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Import from library</div>
                        <div className="text-xs text-muted-foreground">Add a panel from the panel library</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        toast.info('Row - Coming soon');
                        setShowVisualizationDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <div className="w-8 h-8 bg-secondary/50 rounded flex items-center justify-center">
                        📋
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Row</div>
                        <div className="text-xs text-muted-foreground">Add a row to group panels</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-border mx-1" />
              <button 
                onClick={handleDiscardChanges}
                className="grafana-btn grafana-btn-secondary"
                title="Discard unsaved changes"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                className="grafana-btn grafana-btn-primary"
                title="Save all changes to dashboard"
              >
                <Save size={16} />
                Save dashboard
              </button>
            </>
          ) : (
            <button 
              onClick={handleEditModeToggle}
              className="grafana-btn grafana-btn-secondary"
              title="Enter edit mode to add panels"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          <div className="h-6 w-px bg-border mx-1" />

          {/* Time range picker */}
          <div className="relative dropdown-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTimeDropdown(!showTimeDropdown);
                setShowRefreshDropdown(false);
                setShowMoreDropdown(false);
              }}
              className="grafana-btn grafana-btn-secondary min-w-[180px] justify-between"
            >
              <Clock size={16} />
              <span>{timeRange}</span>
              <ChevronDown size={14} />
            </button>
            {showTimeDropdown && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-popover border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in max-h-80 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Relative time ranges
                </div>
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowTimeDropdown(false);
                      triggerRefresh();
                      toast.success(`Time range set to ${range}`);
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

          {/* Refresh picker */}
          <div className="relative dropdown-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRefreshDropdown(!showRefreshDropdown);
                setShowTimeDropdown(false);
                setShowMoreDropdown(false);
              }}
              className={cn(
                "grafana-btn grafana-btn-secondary",
                isRefreshing && "animate-pulse"
              )}
            >
              <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">{refreshInterval}</span>
              <ChevronDown size={14} />
            </button>
            {showRefreshDropdown && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in">
                <button
                  onClick={() => {
                    handleRefreshClick();
                    setShowRefreshDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors text-primary font-medium border-b border-border"
                >
                  Refresh now
                </button>
                {refreshIntervals.map((interval) => (
                  <button
                    key={interval.value}
                    onClick={() => {
                      setRefreshInterval(interval.value);
                      setShowRefreshDropdown(false);
                      if (interval.value !== "Off") {
                        toast.success(`Auto-refresh set to ${interval.label}`);
                      } else {
                        toast.info("Auto-refresh disabled");
                      }
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors",
                      refreshInterval === interval.value && "bg-secondary text-primary"
                    )}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Share button */}
          <button 
            onClick={handleShare}
            className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Share dashboard"
          >
            <Share2 size={18} />
          </button>

          {/* JSON Editor button */}
          <button 
            onClick={() => setShowJSONModal(true)}
            className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Edit dashboard JSON"
          >
            <FileText size={18} />
          </button>

          {/* Settings button */}
          <button 
            onClick={handleSettings}
            className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Dashboard settings"
          >
            <Settings size={18} />
          </button>

          {/* More options */}
          <div className="relative dropdown-container">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreDropdown(!showMoreDropdown);
                setShowTimeDropdown(false);
                setShowRefreshDropdown(false);
              }}
              className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="More options"
            >
              <MoreVertical size={18} />
            </button>
            {showMoreDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in">
                <button
                  onClick={handleViewJSON}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-secondary transition-colors"
                >
                  <Eye size={16} />
                  Edit JSON
                </button>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-secondary transition-colors"
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-secondary transition-colors"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => {
                    toast.error("Dashboard deleted");
                    setShowMoreDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Discard confirmation dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDiscardConfirm(false)} />
          <div className="relative bg-card border border-border rounded-lg shadow-2xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Discard changes?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDiscardConfirm(false)} className="grafana-btn grafana-btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDiscard} className="grafana-btn bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}