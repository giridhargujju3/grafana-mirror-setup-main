import { MoreVertical } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount?: number;
}

interface PieChartPanelProps {
  title: string;
  data?: any[];
  panelId?: string;
  csvPieData?: any[];
  queryResult?: QueryResult;
}

const COLORS = [
  'hsl(199, 89%, 48%)',
  'hsl(142, 71%, 45%)',
  'hsl(45, 100%, 51%)',
  'hsl(280, 100%, 70%)',
  'hsl(0, 72%, 51%)',
  'hsl(24, 100%, 50%)',
];

export function PieChartPanel({ title, data, csvPieData, queryResult }: PieChartPanelProps) {
  let chartData = csvPieData || data || [];

  if (queryResult && queryResult.columns && queryResult.rows) {
    const { columns, rows } = queryResult;
    
    if (columns.length > 0 && rows.length > 0) {
      const firstRow = rows[0];
      
      // Identify numeric columns
      const numericIndices: number[] = [];
      columns.forEach((_, i) => {
        const val = firstRow[i];
        if (typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val))) {
          numericIndices.push(i);
        }
      });

      // Check for time column
      const hasTimeColumn = columns.some(c => {
        const lower = c.toLowerCase();
        return lower.includes('time') || lower.includes('date');
      });

      // MODE 1: Metric Comparison (Multiple numeric columns)
      // If we have multiple numeric columns, we likely want to compare them (e.g. CPU vs Mem)
      if (numericIndices.length > 1) {
        // If we have a time column, we usually want the "Current" (Last) value
        // If no time column, we might want the Sum (e.g. Total Sales A vs Total Sales B)
        const useLastValue = hasTimeColumn;

        if (useLastValue) {
          const lastRow = rows[rows.length - 1];
          chartData = numericIndices.map(index => ({
            name: columns[index],
            value: Number(lastRow[index]) || 0
          }));
        } else {
          // Sum aggregation
          chartData = numericIndices.map(index => {
            const sum = rows.reduce((acc, row) => acc + (Number(row[index]) || 0), 0);
            return { name: columns[index], value: sum };
          });
        }
      } 
      // MODE 2: Category Breakdown (One numeric column)
      else {
        let valueIndex = numericIndices.length > 0 ? numericIndices[0] : -1;
        let nameIndex = -1;

        // Find best name column (prefer non-time string columns)
        const stringIndices: number[] = [];
        columns.forEach((col, i) => {
          const val = firstRow[i];
          if (typeof val === 'string') {
            stringIndices.push(i);
          }
        });

        if (stringIndices.length > 0) {
          // Try to find one that isn't "time" or "date"
          const nonTimeIndex = stringIndices.find(idx => {
            const colName = columns[idx].toLowerCase();
            return !colName.includes('time') && !colName.includes('date');
          });
          nameIndex = nonTimeIndex !== undefined ? nonTimeIndex : stringIndices[0];
        }

        // Fallback strategies
        if (valueIndex === -1) valueIndex = columns.length - 1;
        if (nameIndex === -1) nameIndex = 0;
        if (nameIndex === valueIndex && columns.length > 1) {
          nameIndex = (valueIndex === 0) ? 1 : 0;
        }

        // 1. Map to raw objects
        const rawData = rows.map((row) => ({
          name: String(row[nameIndex]),
          value: Number(row[valueIndex]) || 0
        }));

        // 2. Aggregate by name
        const aggregatedMap = new Map<string, number>();
        rawData.forEach(item => {
          const current = aggregatedMap.get(item.name) || 0;
          aggregatedMap.set(item.name, current + item.value);
        });

        // 3. Convert back to array
        let aggregatedData = Array.from(aggregatedMap.entries()).map(([name, value]) => ({
          name,
          value
        }));

        // 4. Sort by value descending
        aggregatedData.sort((a, b) => b.value - a.value);

        // 5. Limit to top 5 + Other
        if (aggregatedData.length > 5) {
          const top5 = aggregatedData.slice(0, 5);
          const otherValue = aggregatedData.slice(5).reduce((sum, item) => sum + item.value, 0);
          
          chartData = [
            ...top5,
            { name: 'Other', value: otherValue }
          ];
        } else {
          chartData = aggregatedData;
        }
      }
    }
  }

  return (
    <div className="grafana-panel h-full flex flex-col">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
          <MoreVertical size={14} />
        </button>
      </div>
      <div className="grafana-panel-content flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 15%)",
                border: "1px solid hsl(220, 18%, 22%)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}