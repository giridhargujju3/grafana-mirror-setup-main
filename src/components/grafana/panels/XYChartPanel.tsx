import { MoreVertical, Maximize2, X, Edit2, Copy, Trash2, Download } from "lucide-react";
import {
  ScatterChart,
  Scatter,
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

interface XYChartPanelProps {
  panelId?: string;
  title: string;
  data?: any[];
  dataKeys?: { key: string; color: string; name: string }[];
  queryResult?: QueryResult;
}

export function XYChartPanel({ panelId, title, data, dataKeys, queryResult }: XYChartPanelProps) {
  const { setEditingPanel, setShowPanelEditor, removePanel, duplicatePanel, panels, isEditMode } = useDashboard();
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Process data for XY Chart
  const { chartData, chartKeys, xKey } = useMemo(() => {
    let rawData: any[] = data || [];
    
    // Parse QueryResult
    if (queryResult && queryResult.columns && queryResult.rows) {
      const { columns, rows } = queryResult;
      
      // Identify numeric columns
      const numericColIndices = columns
        .map((col, i) => ({ col, i }))
        .filter(({ col, i }) => {
           const firstVal = rows.find(r => r[i] !== null && r[i] !== undefined)?.[i];
           return typeof firstVal === 'number';
        });

      if (numericColIndices.length >= 2) {
         // Use first numeric column as X
         const xColIndex = numericColIndices[0].i;
         const xColName = numericColIndices[0].col;
         
         // Other numeric columns as Y series
         const yColIndices = numericColIndices.slice(1);
         
         const keys = yColIndices.map(({ col }, idx) => ({
          key: col,
          color: [`hsl(142, 71%, 45%)`, `hsl(24, 100%, 50%)`, `hsl(199, 89%, 48%)`, `hsl(280, 100%, 70%)`][idx % 4],
          name: col
        }));

        rawData = rows.map(row => {
          const obj: any = {};
          // Map all columns
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          return obj;
        });

        return { chartData: rawData, chartKeys: keys, xKey: xColName };
      } else if (numericColIndices.length === 1) {
        // Only 1 numeric column. Use index as X? Or Time if available?
        // Let's check for time.
        const timeColIndex = columns.findIndex(c => c.toLowerCase().includes('time'));
        
        // If time exists, it's basically a TimeSeries but plotted as XY.
        // If not, use index.
        const xColName = timeColIndex >= 0 ? columns[timeColIndex] : 'index';
        
        rawData = rows.map((row, idx) => {
          const obj: any = {};
          obj[xColName] = timeColIndex >= 0 ? new Date(row[timeColIndex]).getTime() : idx;
          obj[numericColIndices[0].col] = row[numericColIndices[0].i];
          return obj;
        });

        const keys = [{
             key: numericColIndices[0].col,
             color: "hsl(142, 71%, 45%)",
             name: numericColIndices[0].col
        }];
        
        return { chartData: rawData, chartKeys: keys, xKey: xColName };
      }
    }
    
    // Fallback for mock data
    // Assuming data has 'x' and 'y' or similar
    if (rawData.length > 0) {
        const keys = Object.keys(rawData[0]).filter(k => typeof rawData[0][k] === 'number');
        if (keys.length >= 2) {
            return { 
                chartData: rawData, 
                chartKeys: keys.slice(1).map(k => ({ key: k, color: "hsl(142, 71%, 45%)", name: k })), 
                xKey: keys[0] 
            };
        }
    }

    return { chartData: [], chartKeys: [], xKey: '' };
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
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 22%)" />
            <XAxis
              dataKey="x"
              type="number"
              name={xKey}
              stroke="hsl(210, 15%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              label={{ value: xKey, position: 'bottom', offset: 0, fill: "hsl(210, 15%, 55%)", fontSize: 12 }}
            />
            <YAxis
              dataKey="y"
              type="number"
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
              cursor={{ strokeDasharray: '3 3' }}
              // Custom tooltip to show original values
              formatter={(value: any, name: any, props: any) => {
                // If it's X axis value (which Recharts might pass strangely in scatter), we might want to skip or format
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            {chartKeys.map((dk) => (
              <Scatter
                key={dk.key}
                name={dk.name}
                data={chartData.map(d => ({
                  x: d[xKey],
                  y: d[dk.key],
                  // Preserve original data for tooltip
                  payload: d 
                }))}
                fill={dk.color}
                line={false}
                shape="circle"
              />
            ))}
          </ScatterChart>
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
