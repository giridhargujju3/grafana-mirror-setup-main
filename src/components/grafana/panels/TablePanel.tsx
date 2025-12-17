import { MoreVertical, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: any) => React.ReactNode;
}

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface TablePanelProps {
  title: string;
  columns?: Column[];
  data?: any[];
  csvData?: CSVData;
  panelId?: string;
}

export function TablePanel({ title, columns, data, csvData }: TablePanelProps) {
  // Handle CSV data if provided
  if (csvData && csvData.headers && csvData.rows) {
    const csvColumns: Column[] = csvData.headers.map(header => ({
      key: header,
      label: header,
      align: "left" as const
    }));
    
    const csvTableData = csvData.rows.map((row, index) => {
      const rowObj: any = {};
      csvData.headers.forEach((header, colIndex) => {
        rowObj[header] = row[colIndex] || '';
      });
      return rowObj;
    });
    
    return renderTable(title, csvColumns, csvTableData);
  }
  
  // Handle regular data
  return renderTable(title, columns || [], data || []);
}

function renderTable(title: string, columns: Column[], data: any[]) {
  if (!columns.length || !data.length) {
    return (
      <div className="grafana-panel h-full flex flex-col">
        <div className="grafana-panel-header">
          <h3 className="grafana-panel-title">{title}</h3>
          <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
            <MoreVertical size={14} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="grafana-panel h-full flex flex-col">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
          <MoreVertical size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-card/50">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary to-secondary/80 backdrop-blur">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-foreground border-b-2 border-primary/20 text-left",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    <ArrowUpDown size={12} className="opacity-60 hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/30 hover:bg-primary/5 transition-all duration-200",
                  i % 2 === 0 && "bg-secondary/20"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-foreground font-medium",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
