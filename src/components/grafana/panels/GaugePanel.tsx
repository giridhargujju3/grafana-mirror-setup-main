import { MoreVertical } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugePanelProps {
  title: string;
  value: number;
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string }[];
  unit?: string;
  panelId?: string;
}

export function GaugePanel({
  title,
  value,
  min = 0,
  max = 100,
  thresholds = [
    { value: 70, color: "hsl(var(--grafana-green))" },
    { value: 85, color: "hsl(var(--grafana-yellow))" },
    { value: 100, color: "hsl(var(--grafana-red))" },
  ],
  unit = "%",
}: GaugePanelProps) {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  const getColor = (pct: number) => {
    if (pct < 30) return 'hsl(142, 71%, 45%)';
    if (pct < 70) return 'hsl(45, 100%, 51%)';
    return 'hsl(0, 72%, 51%)';
  };
  
  const data = [
    { name: 'value', value: percentage, color: getColor(percentage) },
    { name: 'remaining', value: 100 - percentage, color: 'hsl(220, 18%, 22%)' }
  ];

  return (
    <div className="grafana-panel h-full flex flex-col">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
          <MoreVertical size={14} />
        </button>
      </div>
      <div className="grafana-panel-content flex-1 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{value.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}
