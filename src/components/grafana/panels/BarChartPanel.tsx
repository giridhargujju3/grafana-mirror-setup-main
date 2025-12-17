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
} from "recharts";

interface BarChartPanelProps {
  title: string;
  data?: any[];
  dataKeys?: { key: string; color: string; name: string }[];
  layout?: "horizontal" | "vertical";
  panelId?: string;
  csvBarData?: any[];
}

export function BarChartPanel({ title, data, dataKeys, layout = "vertical", csvBarData }: BarChartPanelProps) {
  const chartData = csvBarData || data || [];
  const chartKeys = dataKeys || [{ key: "value", color: "hsl(199, 89%, 48%)", name: "Value" }];
  return (
    <div className="grafana-panel h-full flex flex-col">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
            <Maximize2 size={14} />
          </button>
          <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout={layout}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="2 2" 
              stroke="hsl(220, 18%, 25%)" 
              strokeOpacity={0.3}
            />
            {layout === "vertical" ? (
              <>
                <XAxis
                  dataKey="name"
                  stroke="hsl(210, 15%, 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(210, 15%, 65%)' }}
                />
                <YAxis
                  stroke="hsl(210, 15%, 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(210, 15%, 65%)' }}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  stroke="hsl(210, 15%, 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(210, 15%, 65%)' }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="hsl(210, 15%, 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tick={{ fill: 'hsl(210, 15%, 65%)' }}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 12%)",
                border: "1px solid hsl(220, 18%, 25%)",
                borderRadius: "8px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
              }}
              cursor={{ fill: 'hsl(220, 18%, 18%)', fillOpacity: 0.3 }}
            />
            <Legend 
              wrapperStyle={{ 
                fontSize: "13px", 
                paddingTop: "15px",
                color: "hsl(210, 15%, 65%)"
              }} 
            />
            {chartKeys.map((dk, index) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name}
                fill={index === 0 ? "url(#barGradient)" : dk.color}
                radius={layout === "vertical" ? [6, 6, 0, 0] : [0, 6, 6, 0]}
                stroke={dk.color}
                strokeWidth={1}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
