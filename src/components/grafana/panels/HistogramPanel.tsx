import { MoreVertical, Maximize2, X, Edit2, Copy, Trash2, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount?: number;
}

interface HistogramPanelProps {
  panelId?: string;
  title: string;
  data?: any[];
  dataKeys?: { key: string; color: string; name: string }[];
  queryResult?: QueryResult;
}

export function HistogramPanel({ panelId, title, data, dataKeys, queryResult }: HistogramPanelProps) {
  const { setEditingPanel, setShowPanelEditor, removePanel, duplicatePanel, panels, isEditMode } = useDashboard();
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Process data for Histogram
  const { chartData, chartKeys } = useMemo(() => {
    let rawData: any[] = data || [];
    let keys: { key: string; color: string; name: string }[] = dataKeys || [];

    // Parse QueryResult
    if (queryResult && queryResult.columns && queryResult.rows) {
      const { columns, rows } = queryResult;
      
      // Identify numeric columns for histogram analysis
      // We generally ignore 'time' columns for simple histograms of values
      const numericColIndices = columns
        .map((col, i) => ({ col, i }))
        .filter(({ col, i }) => {
           // Simple heuristic: check if first non-null value is number
           const firstVal = rows.find(r => r[i] !== null && r[i] !== undefined)?.[i];
           return typeof firstVal === 'number' && !col.toLowerCase().includes('time');
        });

      if (numericColIndices.length > 0) {
        keys = numericColIndices.map(({ col }, idx) => ({
          key: col,
          color: [`hsl(142, 71%, 45%)`, `hsl(24, 100%, 50%)`, `hsl(199, 89%, 48%)`, `hsl(280, 100%, 70%)`][idx % 4],
          name: col
        }));

        rawData = rows.map(row => {
          const obj: any = {};
          numericColIndices.forEach(({ col, i }) => {
            obj[col] = row[i];
          });
          return obj;
        });
      }
    }

    // Bucketize logic
    // 1. Find min and max across all series
    let min = Infinity;
    let max = -Infinity;
    
    rawData.forEach(row => {
      keys.forEach(k => {
        const val = Number(row[k.key]);
        if (!isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });

    if (min === Infinity) return { chartData: [], chartKeys: [] };

    // 2. Create buckets
    const bucketCount = 20; // Default bucket count
    // Adjust min/max for padding
    const range = max - min || 1; 
    const step = range / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const start = min + i * step;
      const end = start + step;
      return {
        range: `${Math.floor(start)} - ${Math.floor(end)}`,
        min: start,
        max: end,
        ...keys.reduce((acc, k) => ({ ...acc, [k.key]: 0 }), {})
      };
    });

    // 3. Fill buckets
    rawData.forEach(row => {
      keys.forEach(k => {
        const val = Number(row[k.key]);
        if (!isNaN(val)) {
          // Find bucket
          const bucketIndex = Math.min(
            Math.floor((val - min) / step),
            bucketCount - 1
          );
          if (bucketIndex >= 0) {
            buckets[bucketIndex][k.key]++;
          }
        }
      });
    });

    return { chartData: buckets, chartKeys: keys };
  }, [data, dataKeys, queryResult]);

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
                <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <Copy size={14} /> Duplicate
                </button>
                <div className="my-1 border-t border-border" />
                <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
             <defs>
              {chartKeys.map((dk) => (
                <linearGradient key={dk.key} id={`hist-gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dk.color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={dk.color} stopOpacity={0.3} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" vertical={false} />
            <XAxis
              dataKey="range"
              stroke="hsl(210, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="hsl(210, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 15%)",
                border: "1px solid hsl(220, 18%, 22%)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(210, 15%, 65%)" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            {chartKeys.map((dk) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                fill={`url(#hist-gradient-${dk.key})`}
                radius={[4, 4, 0, 0]}
                stackId="a" // Stacked histogram? Or side-by-side? Screenshot shows stacked maybe (overlapping colors) but often histogram with multiple series is side-by-side or layered. 
                // Screenshot shows "memory_usage", "cpu_usage" etc.
                // It looks like they are stacked or overlapping. Recharts 'stackId' will stack them.
                // If we want side by side, remove stackId.
                // Let's assume stacked for now as it's cleaner for distribution comparison sometimes, or maybe overlaid.
                // Actually screenshot 1 shows overlapping translucent bars.
                // Recharts default Bar is side-by-side if no stackId.
                // But if many buckets, side-by-side bars are thin.
                // Let's try stackId="a" to stack them.
              />
            ))}
          </BarChart>
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
