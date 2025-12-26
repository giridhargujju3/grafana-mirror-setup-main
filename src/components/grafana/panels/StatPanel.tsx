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
    <div className="grafana-panel h-full flex flex-col">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <div className="panel-header-actions">
          <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background accent */}
        <div className={cn("absolute inset-0 opacity-30", bgColorMap[color])} />
        
        {/* Sparkline background */}
        {sparklineData && (
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <path
              d={`M 0 100 ${sparklineData
                .map((v, i) => `L ${(i / (sparklineData.length - 1)) * 100}% ${100 - v}%`)
                .join(" ")} L 100% 100 Z`}
              fill={`hsl(var(--grafana-${color}))`}
            />
          </svg>
        )}

        <div className="relative z-10 text-center">
          <div className={cn("grafana-stat-value", colorMap[color])}>
            {value}
            {unit && <span className="text-2xl ml-1">{unit}</span>}
          </div>
          {subtitle && <div className="grafana-stat-label">{subtitle}</div>}
          {trend && trendValue && (
            <div className={cn("flex items-center justify-center gap-1 mt-2 text-sm", trendColor)}>
              <TrendIcon size={14} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
