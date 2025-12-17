import { useState } from "react";
import { MoreVertical, Maximize2, X, Edit2, Copy, Trash2, Download } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";

interface TimeSeriesPanelProps {
  panelId?: string;
  title: string;
  data?: any[];
  dataKeys?: { key: string; color: string; name: string }[];
  csvTimeSeriesData?: any[];
  timeColumn?: string;
  numericColumns?: string[];
}

export function TimeSeriesPanel({ panelId, title, data, dataKeys, csvTimeSeriesData, timeColumn, numericColumns }: TimeSeriesPanelProps) {
  // Handle CSV data
  const chartData = csvTimeSeriesData || data || [];
  const chartKeys = dataKeys || (numericColumns ? numericColumns.map((col, i) => ({
    key: col,
    color: [`hsl(24, 100%, 50%)`, `hsl(199, 89%, 48%)`, `hsl(142, 71%, 45%)`, `hsl(280, 100%, 70%)`][i % 4],
    name: col
  })) : []);
  const { setEditingPanel, setShowPanelEditor, removePanel, duplicatePanel, panels, isEditMode } = useDashboard();
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const toggleSeries = (key: string) => {
    setHiddenSeries(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleEdit = () => {
    if (panelId) {
      const panel = panels.find(p => p.id === panelId);
      if (panel) {
        setEditingPanel(panel);
        setShowPanelEditor(true);
      }
    }
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    if (panelId) {
      duplicatePanel(panelId);
      toast.success("Panel duplicated");
    }
    setShowMenu(false);
  };

  const handleExport = () => {
    const csvContent = [
      ["Time", ...chartKeys.map(dk => dk.name)].join(","),
      ...chartData.map(row => [row.time || row[timeColumn || 'time'], ...chartKeys.map(dk => row[dk.key])].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Panel data exported");
    setShowMenu(false);
  };

  const handleRemove = () => {
    if (panelId) {
      removePanel(panelId);
      toast.success("Panel removed");
    }
    setShowMenu(false);
  };

  const PanelContent = () => (
    <div className={cn(
      "grafana-panel h-full flex flex-col", 
      isFullscreen && "fixed inset-4 z-50",
      isEditMode && "cursor-pointer hover:ring-2 hover:ring-primary/50"
    )} onClick={isEditMode && !showMenu ? handleEdit : undefined}>
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-1 rounded hover:bg-secondary/50 text-muted-foreground transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? <X size={14} /> : <Maximize2 size={14} />}
          </button>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-secondary/50 text-muted-foreground transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-popover border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <Download size={14} /> Export CSV
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {chartKeys.map((dk) => (
                <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dk.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={dk.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
            <XAxis
              dataKey={timeColumn || "time"}
              stroke="hsl(210, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(210, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 15%)",
                border: "1px solid hsl(220, 18%, 22%)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              iconType="line"
              onClick={(e) => toggleSeries(e.dataKey as string)}
            />
            {chartKeys.map((dk) => (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color}
                strokeWidth={2}
                fill={`url(#gradient-${dk.key})`}
                hide={hiddenSeries.includes(dk.key)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <>
        <div className="fixed inset-0 bg-background/90 z-40" onClick={() => setIsFullscreen(false)} />
        <PanelContent />
      </>
    );
  }

  return <PanelContent />;
}
