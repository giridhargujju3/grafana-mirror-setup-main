import { MoreVertical } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount?: number;
}

interface GaugePanelProps {
  title: string;
  value: number;
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string }[];
  unit?: string;
  panelId?: string;
  queryResult?: QueryResult;
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
  queryResult,
}: GaugePanelProps) {
  
  // Handle Query Result
  if (queryResult && queryResult.columns && queryResult.rows) {
    const { columns, rows } = queryResult;
    if (rows.length > 0) {
      // Find first numeric column
      // We look for a column that is numeric and NOT "time"
      let valIndex = -1;
      
      // Check column definitions or data types
      for (let i = 0; i < columns.length; i++) {
        const colName = columns[i].toLowerCase();
        // Skip time/date columns
        if (colName.includes('time') || colName.includes('date')) continue;
        
        // Check first non-null value in this column
        const validRow = rows.find(r => r[i] !== null && r[i] !== undefined);
        if (validRow && typeof validRow[i] === 'number') {
          valIndex = i;
          break;
        }
      }
      
      // Fallback: if no numeric column found excluding time, try ANY numeric column
      if (valIndex === -1) {
        valIndex = rows[0].findIndex((val: any) => typeof val === 'number');
      }
      
      // Fallback: last column
      if (valIndex === -1) valIndex = columns.length - 1;

      // Use last row value (latest data)
      const lastRow = rows[rows.length - 1];
      const possibleValue = Number(lastRow[valIndex]);
      
      if (!isNaN(possibleValue)) {
        value = possibleValue;
      }
    }
  }

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
