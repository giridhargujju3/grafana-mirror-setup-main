import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount?: number;
}

interface StatPanelProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "orange" | "blue" | "green" | "red" | "yellow" | "purple";
  sparklineData?: number[];
  panelId?: string;
  queryResult?: QueryResult;
}

const colorMap = {
  orange: "text-grafana-orange",
  blue: "text-grafana-blue",
  green: "text-grafana-green",
  red: "text-grafana-red",
  yellow: "text-grafana-yellow",
  purple: "text-grafana-purple",
};

const bgColorMap = {
  orange: "bg-grafana-orange/10",
  blue: "bg-grafana-blue/10",
  green: "bg-grafana-green/10",
  red: "bg-grafana-red/10",
  yellow: "bg-grafana-yellow/10",
  purple: "bg-grafana-purple/10",
};

export function StatPanel({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendValue,
  color = "green",
  sparklineData,
  queryResult,
}: StatPanelProps) {
  
  // Handle Query Result
  if (queryResult && queryResult.columns && queryResult.rows) {
    const { columns, rows } = queryResult;
    if (rows.length > 0) {
      // Find first numeric column
      let valIndex = -1;
      const firstRow = rows[0];
      valIndex = firstRow.findIndex((val: any) => typeof val === 'number');
      if (valIndex === -1) valIndex = columns.length - 1;

      // Use last row value
      const lastRow = rows[rows.length - 1];
      value = lastRow[valIndex];

      // Generate sparkline data from that column
      if (rows.length > 1) {
        const rawData = rows.map(r => Number(r[valIndex]) || 0);
        // Normalize sparkline data to 0-100 range for SVG
        const max = Math.max(...rawData);
        const min = Math.min(...rawData);
        const range = max - min;
        if (range > 0) {
          sparklineData = rawData.map(v => ((v - min) / range) * 100);
        } else {
          sparklineData = rawData.map(() => 50);
        }
      }
    }
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-grafana-green" : trend === "down" ? "text-grafana-red" : "text-muted-foreground";

  return (
    <div className="grafana-panel h-full flex flex-col group">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <div className="panel-header-actions">
          <button className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background accent with gradient */}
        <div className={cn("absolute inset-0 opacity-20", bgColorMap[color])}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/50" />
        </div>
        
        {/* Sparkline background */}
        {sparklineData && (
          <svg className="absolute inset-0 w-full h-full opacity-15 transition-opacity duration-300 group-hover:opacity-25" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={`hsl(var(--grafana-${color}))`} stopOpacity="0.5" />
                <stop offset="100%" stopColor={`hsl(var(--grafana-${color}))`} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d={`M 0 100 ${sparklineData
                .map((v, i) => `L ${(i / (sparklineData.length - 1)) * 100}% ${100 - v}%`)
                .join(" ")} L 100% 100 Z`}
              fill={`url(#sparkline-gradient-${color})`}
            />
            <polyline
              points={sparklineData.map((v, i) => `${(i / (sparklineData.length - 1)) * 100},${100 - v}`).join(" ")}
              fill="none"
              stroke={`hsl(var(--grafana-${color}))`}
              strokeWidth="2"
              strokeOpacity="0.4"
            />
          </svg>
        )}

        <div className="relative z-10 text-center transition-transform duration-200 group-hover:scale-105">
          <div className={cn("grafana-stat-value", colorMap[color])} style={{textShadow: "0 2px 8px rgba(0,0,0,0.3)"}}>
            {value}
            {unit && <span className="text-3xl ml-1 opacity-80">{unit}</span>}
          </div>
          {subtitle && <div className="grafana-stat-label mt-1">{subtitle}</div>}
          {trend && trendValue && (
            <div className={cn("flex items-center justify-center gap-1.5 mt-3 text-sm font-medium", trendColor)}>
              <TrendIcon size={16} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
