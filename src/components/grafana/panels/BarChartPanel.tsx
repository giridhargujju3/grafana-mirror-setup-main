import { MoreVertical, Maximize2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList
} from "recharts";

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount?: number;
}

interface BarChartPanelProps {
  title: string;
  data?: any[];
  dataKeys?: { key: string; color: string; name: string }[];
  layout?: "horizontal" | "vertical";
  stacking?: "none" | "normal" | "percent";
  panelId?: string;
  csvBarData?: any[];
  queryResult?: QueryResult;
  xAxisKey?: string;
  // New options
  xTickLabelRotation?: number;
  barWidth?: number; // 0 to 1 (relative to available space) or pixel value? Recharts uses barSize (pixels) or barCategoryGap (percentage). Let's use 0-1 for category gap.
  groupWidth?: number; // Gap between bars in a group
  barRadius?: number;
  showValues?: "auto" | "always" | "never";
}

export function BarChartPanel({ 
  title, 
  data, 
  dataKeys, 
  layout = "vertical", 
  stacking = "none", 
  csvBarData, 
  queryResult, 
  xAxisKey,
  xTickLabelRotation = 0,
  barWidth = 0.8, // Increased default width
  groupWidth = 0.2,
  barRadius = 2, // Slight radius for better look
  showValues = "auto"
}: BarChartPanelProps) {
  let chartData = [...(csvBarData || data || [])];
  
  // Ensure 'name' exists for default data
  if (chartData.length > 0 && !chartData[0].name) {
    chartData = chartData.map(item => ({
      ...item,
      name: item.time || item.label || item.category || "Unknown"
    }));
  }

  let chartKeys = dataKeys || [{ key: "value", color: "#3274D9", name: "Value" }];

  // Handle Query Result
  if (queryResult && queryResult.columns && queryResult.rows) {
    const { columns, rows } = queryResult;
    
    if (columns.length > 0) {
      // Find category column (X-axis)
      let catIndex = -1;
      
      if (xAxisKey) {
        catIndex = columns.indexOf(xAxisKey);
      }
      
      if (catIndex === -1 && rows.length > 0) {
        const firstRow = rows[0];
        // Prefer first string column that isn't "time" if possible, or just first string
        catIndex = firstRow.findIndex((val: any, idx: number) => 
          typeof val === 'string' && columns[idx].toLowerCase() !== 'time'
        );
        
        // If no non-time string found, try any string
        if (catIndex === -1) {
            catIndex = firstRow.findIndex((val: any) => typeof val === 'string');
        }

        // If still no string found, maybe use time
        if (catIndex === -1) {
          catIndex = columns.findIndex(col => col.toLowerCase() === 'time');
        }
      }
      if (catIndex === -1) catIndex = 0; // Default to first column

      // Identify value columns (numeric columns only)
      const valueColIndices = columns.map((_, i) => i).filter(i => {
        if (i === catIndex) return false;
        // Check if there's at least one number in this column
        return rows.some(row => typeof row[i] === 'number');
      });

      chartData = rows.map(row => {
        const obj: any = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        // Map category column to 'name' for Recharts
        obj.name = String(row[catIndex]);
        return obj;
      });

      if (valueColIndices.length > 0) {
        const GRAFANA_PALETTE = [
          "#7EB26D", "#EAB839", "#6ED0E0", "#EF843C", "#E24D42", 
          "#1F78C1", "#BA43A9", "#705DA0", "#508642", "#CCA300"
        ];
        
        chartKeys = valueColIndices.map((i, idx) => ({
          key: columns[i],
          color: GRAFANA_PALETTE[idx % GRAFANA_PALETTE.length],
          name: columns[i]
        }));
      }
    }
  }

  // Recharts layout logic:
  // "horizontal" in Recharts = categories on X (Standard Vertical Bars)
  // "vertical" in Recharts = categories on Y (Horizontal Bars)
  // Our prop 'layout' means:
  // "vertical" -> Standard Vertical Bars -> Recharts "horizontal"
  // "horizontal" -> Horizontal Bars -> Recharts "vertical"
  const rechartsLayout = layout === "vertical" ? "horizontal" : "vertical";
  
  const barCategoryGap = `${(1 - Math.min(Math.max(barWidth, 0.1), 1)) * 100}%`;
  
  // Create a unique ID for the gradient to avoid conflicts
  const gradientId = `barGradient-${title.replace(/\s+/g, '-').toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
  
  return (
    <div className="grafana-panel h-full flex flex-col bg-[#111217] rounded-md overflow-hidden border border-[#26292e]">
      <div className="grafana-panel-header px-3 py-1.5 flex items-center justify-between border-b border-[#26292e]">
        <h3 className="text-xs font-semibold text-[#d8d9da] truncate">{title}</h3>
        <div className="flex items-center gap-1 panel-header-actions">
          <button className="p-0.5 rounded hover:bg-white/10 text-[#9f9fa0]" onClick={(e) => e.stopPropagation()}>
            <Maximize2 size={12} />
          </button>
          <button className="p-0.5 rounded hover:bg-white/10 text-[#9f9fa0]" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={12} />
          </button>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout={rechartsLayout}
            stackOffset={stacking === "percent" ? "expand" : undefined}
            barCategoryGap={barCategoryGap}
            margin={{ top: 10, right: 10, left: 0, bottom: xTickLabelRotation !== 0 ? 40 : 10 }}
          >
            <defs>
              {chartKeys.map((dk, idx) => (
                <linearGradient key={`grad-${idx}`} id={`${gradientId}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dk.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={dk.color} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#26292e" 
              vertical={rechartsLayout === "vertical"}
              horizontal={rechartsLayout === "horizontal"}
            />
            {rechartsLayout === "horizontal" ? (
              <>
                <XAxis
                  dataKey="name"
                  stroke="#5c6773"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#9f9fa0', angle: -xTickLabelRotation, textAnchor: xTickLabelRotation !== 0 ? 'end' : 'middle' }}
                  height={xTickLabelRotation !== 0 ? 60 : 30}
                  interval={0}
                />
                <YAxis
                  stroke="#5c6773"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#9f9fa0' }}
                  tickFormatter={(val) => stacking === 'percent' ? `${(val * 100).toFixed(0)}%` : val}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  stroke="#5c6773"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#9f9fa0' }}
                  tickFormatter={(val) => stacking === 'percent' ? `${(val * 100).toFixed(0)}%` : val}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#5c6773"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tick={{ fill: '#9f9fa0' }}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "#181b1f",
                border: "1px solid #26292e",
                borderRadius: "2px",
                fontSize: "12px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                color: "#d8d9da"
              }}
              itemStyle={{ padding: '2px 0' }}
              cursor={{ fill: '#ffffff', fillOpacity: 0.05 }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ 
                fontSize: "11px", 
                paddingTop: "10px",
                color: "#9f9fa0"
              }} 
            />
            {chartKeys.map((dk, index) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                stackId={stacking !== "none" ? "a" : undefined}
                fill={`url(#${gradientId}-${index})`}
                radius={
                    stacking !== "none" 
                    ? [0, 0, 0, 0] 
                    : (rechartsLayout === "horizontal" ? [barRadius, barRadius, 0, 0] : [0, barRadius, barRadius, 0])
                }
                stroke={dk.color}
                strokeWidth={1}
                animationDuration={500}
              >
                {(showValues === "always" || (showValues === "auto" && chartData.length < 15)) && (
                   <LabelList 
                     dataKey={dk.key} 
                     position={rechartsLayout === "horizontal" ? "top" : "right"} 
                     fill="#d8d9da" 
                     fontSize={10}
                     formatter={(val: any) => stacking === 'percent' ? `${(val * 100).toFixed(0)}%` : val}
                   />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
