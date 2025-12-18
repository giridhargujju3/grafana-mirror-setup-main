import { useState, useCallback } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle, Download, Globe } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { CSVDataSource, csvUtils, CSVData } from "@/lib/csvDataSource";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSVImportState {
  csvData: CSVData | null;
  csvText: string;
  isLoading: boolean;
  error: string | null;
  dataSource: 'file' | 'url' | 'text';
  csvUrl: string;
}

export function CSVImportModal({ isOpen, onClose }: CSVImportModalProps) {
  const [state, setState] = useState<CSVImportState>({
    csvData: null,
    csvText: '',
    isLoading: false,
    error: null,
    dataSource: 'file',
    csvUrl: ''
  });
  const { addPanel, setIsEditMode } = useDashboard();

  const parseCSV = useCallback((text: string): void => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const validation = csvUtils.validateCSV(text);
      if (!validation.isValid) {
        setState(prev => ({ ...prev, error: validation.error || 'Invalid CSV format', isLoading: false }));
        return;
      }
      
      const csvDataSource = new CSVDataSource({ delimiter: csvUtils.detectDelimiter(text) });
      const data = csvDataSource.parseCSV(text);
      
      setState(prev => ({ 
        ...prev, 
        csvData: data, 
        csvText: text,
        error: null,
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to parse CSV',
        isLoading: false 
      }));
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setState(prev => ({ ...prev, error: 'Please select a CSV file' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, dataSource: 'file' }));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.onerror = () => {
      setState(prev => ({ ...prev, error: 'Failed to read file', isLoading: false }));
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleTextChange = useCallback((text: string) => {
    setState(prev => ({ ...prev, csvText: text, dataSource: 'text' }));
    if (text.trim()) {
      parseCSV(text);
    } else {
      setState(prev => ({ ...prev, csvData: null, error: null }));
    }
  }, [parseCSV]);

  const handleUrlLoad = useCallback(async () => {
    if (!state.csvUrl.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a valid URL' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, dataSource: 'url', error: null }));
    
    try {
      const response = await fetch(state.csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      parseCSV(text);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load CSV from URL',
        isLoading: false 
      }));
    }
  }, [state.csvUrl, parseCSV]);

  const loadSampleData = useCallback(() => {
    const sampleCSV = csvUtils.generateSampleCSV();
    setState(prev => ({ ...prev, dataSource: 'text' }));
    parseCSV(sampleCSV);
  }, [parseCSV]);

  const createDashboardFromCSV = useCallback(() => {
    if (!state.csvData) return;

    const csvDataSource = new CSVDataSource({});
    const { csvData } = state;
    const dataFrame = csvDataSource.csvDataToDataFrame(csvData, 'CSV Data');

    const numericFields = csvDataSource.getNumericFields(dataFrame);
    const timeFields = csvDataSource.getTimeFields(dataFrame);
    const categoricalFields = csvDataSource.getCategoricalFields(dataFrame);
    
    // Legacy support
    const numericColumns = numericFields.map(f => f.name);
    const timeColumn = timeFields[0]?.name || null;
    const categoricalColumns = categoricalFields.map(f => f.name);

    let yPos = 0;

    // Create stat panels for key metrics
    numericColumns.slice(0, 4).forEach((header, index) => {
      const values = csvData.rows.map(row => Number(row[csvData.headers.indexOf(header)])).filter(v => !isNaN(v));
      const latest = values[values.length - 1] || 0;
      const avg = values.reduce((a, b) => a + b, 0) / values.length || 0;
      
      const field = numericFields[index];
      addPanel({
        id: `csv-stat-${field.name}-${Date.now()}-${index}`,
        type: "stat",
        title: field.name,
        gridPos: { x: index * 3, y: yPos, w: 3, h: 3 },
        options: {
          value: latest,
          unit: field.config?.unit || "",
          color: ["blue", "green", "orange", "purple"][index % 4],
          trend: latest > avg ? "up" : "down",
          trendValue: `${((latest - avg) / avg * 100).toFixed(1)}%`,
          sparklineData: values.slice(-10)
        },
        fieldConfig: {
          defaults: {
            ...field.config,
            color: { mode: 'fixed', fixedColor: ["blue", "green", "orange", "purple"][index % 4] }
          }
        },
        targets: [{
          refId: 'A',
          datasource: { type: 'csv', name: 'CSV Data Source' },
          scenarioId: 'csv_content',
          csvContent: state.csvText,
          alias: field.name
        }]
      });
    });

    yPos += 3;

    // Create time series if time column exists
    if (timeColumn && numericColumns.length > 0) {
      const timeSeriesData = csvDataSource.transformToTimeSeriesData(csvData, timeColumn, numericColumns);

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
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const categoricalCol = categoricalColumns[0];
      const aggregatedData = csvDataSource.aggregateByCategory(csvData, categoricalCol, numericColumns[0]);

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

    setIsEditMode(true);
    onClose();
  }, [state.csvData, addPanel, setIsEditMode, onClose]);

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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">CSV Import</h3>
                <button
                  onClick={loadSampleData}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Download size={14} />
                  Load Sample
                </button>
              </div>
              
              {/* Data Source Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setState(prev => ({ ...prev, dataSource: 'file' }))}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    state.dataSource === 'file' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  File Upload
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, dataSource: 'url' }))}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    state.dataSource === 'url' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, dataSource: 'text' }))}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    state.dataSource === 'text' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Paste Data
                </button>
              </div>

              {/* File Upload Tab */}
              {state.dataSource === 'file' && (
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
              )}

              {/* URL Tab */}
              {state.dataSource === 'url' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={state.csvUrl}
                        onChange={(e) => setState(prev => ({ ...prev, csvUrl: e.target.value }))}
                        placeholder="https://example.com/data.csv"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                      />
                    </div>
                    <button
                      onClick={handleUrlLoad}
                      disabled={state.isLoading || !state.csvUrl.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Globe size={16} />
                      Load
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a public URL to a CSV file. Make sure the server allows CORS requests.
                  </p>
                </div>
              )}

              {/* Text Input Tab */}
              {state.dataSource === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Paste CSV Content
                  </label>
                  <textarea
                    value={state.csvText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="timestamp,server,cpu_usage,memory_usage&#10;2024-01-01 00:00:00,server-1,45.2,62.1&#10;2024-01-01 00:05:00,server-1,48.7,64.3"
                    className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm font-mono resize-none"
                  />
                </div>
              )}

              {/* Loading State */}
              {state.isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground mt-2">Processing CSV...</p>
                </div>
              )}

              {/* Error State */}
              {state.error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  <AlertCircle size={16} />
                  {state.error}
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Preview Data</h3>
              
              {state.csvData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle size={16} />
                    Successfully loaded {state.csvData.rows.length} rows with {state.csvData.headers.length} columns.
                  </div>
                  
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary">
                          <tr>
                            {state.csvData.headers.map((header, index) => (
                              <th key={index} className="px-3 py-2 text-left font-medium text-foreground border-r border-border last:border-r-0">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {state.csvData.rows.slice(0, 10).map((row, rowIndex) => (
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
                    {state.csvData.rows.length > 10 && (
                      <div className="px-3 py-2 bg-secondary text-xs text-muted-foreground border-t border-border">
                        Showing first 10 rows of {state.csvData.rows.length} total rows
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
          {state.csvData && !state.error && (
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