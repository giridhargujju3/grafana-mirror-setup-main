import { useState, useCallback } from "react";
import { X, Upload, FileText, CheckCircle } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSVData {
  headers: string[];
  rows: string[][];
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [csvText, setCsvText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addPanel, setIsEditMode } = useDashboard();

  const parseCSV = useCallback((text: string): CSVData => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    return { headers, rows };
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      setCsvData(parseCSV(text));
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleTextChange = useCallback((text: string) => {
    setCsvText(text);
    if (text.trim()) {
      setCsvData(parseCSV(text));
    } else {
      setCsvData(null);
    }
  }, [parseCSV]);

  const createDashboardFromCSV = useCallback(() => {
    if (!csvData) return;

    const numericColumns = csvData.headers.filter((header, index) => {
      return csvData.rows.some(row => !isNaN(Number(row[index])) && row[index] !== '');
    });

    const timeColumn = csvData.headers.find(header => 
      header.toLowerCase().includes('time') || header.toLowerCase().includes('date')
    );

    let yPos = 0;

    // Create stat panels for key metrics
    numericColumns.slice(0, 4).forEach((header, index) => {
      const values = csvData.rows.map(row => Number(row[csvData.headers.indexOf(header)])).filter(v => !isNaN(v));
      const latest = values[values.length - 1] || 0;
      const avg = values.reduce((a, b) => a + b, 0) / values.length || 0;
      
      addPanel({
        id: `csv-stat-${header}-${Date.now()}-${index}`,
        type: "stat",
        title: header,
        gridPos: { x: index * 3, y: yPos, w: 3, h: 3 },
        options: {
          value: latest,
          unit: "",
          color: ["blue", "green", "orange", "purple"][index % 4],
          trend: latest > avg ? "up" : "down",
          trendValue: `${((latest - avg) / avg * 100).toFixed(1)}%`,
          sparklineData: values.slice(-10)
        },
      });
    });

    yPos += 3;

    // Create time series if time column exists
    if (timeColumn && numericColumns.length > 0) {
      const timeSeriesData = csvData.rows.map(row => {
        const obj: any = { time: row[csvData.headers.indexOf(timeColumn)] };
        numericColumns.forEach(col => {
          obj[col] = Number(row[csvData.headers.indexOf(col)]) || 0;
        });
        return obj;
      });

      addPanel({
        id: `csv-timeseries-${Date.now()}`,
        type: "timeseries",
        title: "Time Series Data",
        gridPos: { x: 0, y: yPos, w: 8, h: 4 },
        options: { csvTimeSeriesData: timeSeriesData, timeColumn, numericColumns },
      });

      // Create gauge for first numeric column
      if (numericColumns[0]) {
        const values = csvData.rows.map(row => Number(row[csvData.headers.indexOf(numericColumns[0])])).filter(v => !isNaN(v));
        addPanel({
          id: `csv-gauge-${Date.now()}`,
          type: "gauge",
          title: `${numericColumns[0]} Gauge`,
          gridPos: { x: 8, y: yPos, w: 4, h: 4 },
          options: { value: values[values.length - 1] || 0 },
        });
      }

      yPos += 4;
    }

    // Create bar chart and pie chart for categorical data
    const categoricalCol = csvData.headers.find(h => !numericColumns.includes(h) && h !== timeColumn);
    if (categoricalCol && numericColumns[0]) {
      const aggregatedData = csvData.rows.reduce((acc: any[], row) => {
        const category = row[csvData.headers.indexOf(categoricalCol)];
        const value = Number(row[csvData.headers.indexOf(numericColumns[0])]) || 0;
        const existing = acc.find(item => item.name === category);
        if (existing) {
          existing.value += value;
        } else {
          acc.push({ name: category, value });
        }
        return acc;
      }, []);

      addPanel({
        id: `csv-barchart-${Date.now()}`,
        type: "barchart",
        title: `${numericColumns[0]} by ${categoricalCol}`,
        gridPos: { x: 0, y: yPos, w: 6, h: 4 },
        options: { csvBarData: aggregatedData },
      });

      addPanel({
        id: `csv-piechart-${Date.now()}`,
        type: "piechart",
        title: `${categoricalCol} Distribution`,
        gridPos: { x: 6, y: yPos, w: 6, h: 4 },
        options: { csvPieData: aggregatedData },
      });

      yPos += 4;
    }

    // Create table panel
    addPanel({
      id: `csv-table-${Date.now()}`,
      type: "table",
      title: "Raw Data",
      gridPos: { x: 0, y: yPos, w: 12, h: 6 },
      options: { csvData },
    });

    // Add alert list panel
    addPanel({
      id: `csv-alerts-${Date.now()}`,
      type: "alertlist",
      title: "System Alerts",
      gridPos: { x: 0, y: yPos + 6, w: 6, h: 4 },
      options: {},
    });

    setIsEditMode(true);
    onClose();
  }, [csvData, addPanel, setIsEditMode, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 bg-card border border-border rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Import CSV Data</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CSV Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">CSV Import</h3>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Click to upload or drag & drop CSV files only
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <FileText size={16} />
                  Upload File
                </label>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Or Paste Content
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="time,server,cpu_usage,memory_usage,disk_usage,network_in,network_out&#10;2025-12-01 00:00:00,server-1,30,40,50,100,80&#10;2025-12-01 00:05:00,server-2,31,41,51,101,81"
                  className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm font-mono resize-none"
                />
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground mt-2">Processing CSV...</p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Preview Data</h3>
              
              {csvData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle size={16} />
                    Successfully loaded {csvData.rows.length} rows with {csvData.headers.length} columns.
                  </div>
                  
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary">
                          <tr>
                            {csvData.headers.map((header, index) => (
                              <th key={index} className="px-3 py-2 text-left font-medium text-foreground border-r border-border last:border-r-0">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-border">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 text-muted-foreground border-r border-border last:border-r-0">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.rows.length > 10 && (
                      <div className="px-3 py-2 bg-secondary text-xs text-muted-foreground border-t border-border">
                        Showing first 10 rows of {csvData.rows.length} total rows
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No data loaded yet</p>
                    <p className="text-sm text-muted-foreground">Upload a CSV file or paste data on the left to preview it here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {csvData && (
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createDashboardFromCSV}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Create Dashboard from Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}