import { useState, useCallback } from "react";
import { FileText, Upload, Globe, Code, Eye, Settings } from "lucide-react";
import { CSVDataSource, csvUtils } from "@/lib/csvDataSource";

interface CSVQueryEditorProps {
  query: CSVQuery;
  onChange: (query: CSVQuery) => void;
  onRunQuery: () => void;
}

export interface CSVQuery {
  refId: string;
  scenarioId: 'csv_content' | 'csv_file' | 'csv_url';
  csvContent?: string;
  csvFileName?: string;
  csvUrl?: string;
  alias?: string;
  dropPercent?: number;
  labels?: string;
}

const scenarios = [
  { id: 'csv_content', name: 'CSV Content', description: 'Paste CSV data directly' },
  { id: 'csv_file', name: 'CSV File', description: 'Upload a CSV file' },
  { id: 'csv_url', name: 'CSV URL', description: 'Load CSV from URL' },
];

export function CSVQueryEditor({ query, onChange, onRunQuery }: CSVQueryEditorProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScenarioChange = useCallback((scenarioId: string) => {
    onChange({
      ...query,
      scenarioId: scenarioId as CSVQuery['scenarioId'],
      csvContent: undefined,
      csvFileName: undefined,
      csvUrl: undefined,
    });
  }, [query, onChange]);

  const handleInputChange = useCallback((field: string, value: any) => {
    const updatedQuery = { ...query, [field]: value };
    onChange(updatedQuery);
    
    // Auto-preview for content changes
    if (field === 'csvContent' && value) {
      previewCSV(value);
    }
  }, [query, onChange]);

  const previewCSV = useCallback(async (content: string) => {
    if (!content.trim()) {
      setPreviewData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const validation = csvUtils.validateCSV(content);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid CSV format');
        setPreviewData(null);
        return;
      }

      const csvDataSource = new CSVDataSource({});
      const dataFrame = csvDataSource.parseCSVToDataFrame(content);
      setPreviewData(dataFrame);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleInputChange('csvContent', content);
      handleInputChange('csvFileName', file.name);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, [handleInputChange]);

  const loadFromUrl = useCallback(async () => {
    if (!query.csvUrl?.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(query.csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      handleInputChange('csvContent', content);
      previewCSV(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV from URL');
    } finally {
      setIsLoading(false);
    }
  }, [query.csvUrl, handleInputChange, previewCSV]);

  const loadSampleData = useCallback(() => {
    const sampleCSV = csvUtils.generateSampleCSV();
    handleInputChange('csvContent', sampleCSV);
    handleScenarioChange('csv_content');
  }, [handleInputChange, handleScenarioChange]);

  return (
    <div className="space-y-4">
      {/* Scenario Selection */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground min-w-[100px]">Scenario:</label>
        <select
          value={query.scenarioId}
          onChange={(e) => handleScenarioChange(e.target.value)}
          className="px-3 py-1 border border-border rounded bg-background text-foreground text-sm"
        >
          {scenarios.map(scenario => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
        <button
          onClick={loadSampleData}
          className="px-3 py-1 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <FileText size={14} />
          Sample Data
        </button>
      </div>

      {/* Common Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground min-w-[60px]">Alias:</label>
          <input
            type="text"
            value={query.alias || ''}
            onChange={(e) => handleInputChange('alias', e.target.value)}
            placeholder="optional"
            className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground min-w-[80px]">Drop %:</label>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={query.dropPercent || ''}
            onChange={(e) => handleInputChange('dropPercent', Number(e.target.value))}
            placeholder="0"
            className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground min-w-[60px]">Labels:</label>
          <input
            type="text"
            value={query.labels || ''}
            onChange={(e) => handleInputChange('labels', e.target.value)}
            placeholder="key=value, key2=value2"
            className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
          />
        </div>
      </div>

      {/* Scenario-specific inputs */}
      {query.scenarioId === 'csv_content' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">CSV Content:</label>
          <textarea
            value={query.csvContent || ''}
            onChange={(e) => handleInputChange('csvContent', e.target.value)}
            placeholder="timestamp,server,cpu_usage,memory_usage&#10;2024-01-01 00:00:00,server-1,45.2,62.1&#10;2024-01-01 00:05:00,server-1,48.7,64.3"
            className="w-full h-32 px-3 py-2 border border-border rounded bg-background text-foreground text-sm font-mono resize-y"
          />
        </div>
      )}

      {query.scenarioId === 'csv_file' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Upload CSV File:</label>
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-upload"
            />
            <label
              htmlFor="csv-file-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <FileText size={16} />
              Choose File
            </label>
            {query.csvFileName && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {query.csvFileName}
              </p>
            )}
          </div>
        </div>
      )}

      {query.scenarioId === 'csv_url' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">CSV URL:</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={query.csvUrl || ''}
              onChange={(e) => handleInputChange('csvUrl', e.target.value)}
              placeholder="https://example.com/data.csv"
              className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
            />
            <button
              onClick={loadFromUrl}
              disabled={isLoading || !query.csvUrl?.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Globe size={16} />
              Load
            </button>
          </div>
        </div>
      )}

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Processing CSV...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          <Settings size={16} />
          {error}
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Preview: {previewData.length} rows, {previewData.fields?.length} fields
            </span>
          </div>
          <div className="border border-border rounded overflow-hidden">
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    {previewData.fields?.map((field: any, index: number) => (
                      <th key={index} className="px-3 py-2 text-left font-medium text-foreground border-r border-border last:border-r-0">
                        {field.name}
                        <span className="text-xs text-muted-foreground ml-1">({field.type})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.min(5, previewData.length) }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border">
                      {previewData.fields?.map((field: any, fieldIndex: number) => (
                        <td key={fieldIndex} className="px-3 py-2 text-muted-foreground border-r border-border last:border-r-0">
                          {field.values[rowIndex]?.toString() || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 5 && (
              <div className="px-3 py-2 bg-secondary text-xs text-muted-foreground border-t border-border">
                Showing first 5 rows of {previewData.length} total rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {scenarios.find(s => s.id === query.scenarioId)?.description && (
        <p className="text-sm text-muted-foreground">
          {scenarios.find(s => s.id === query.scenarioId)?.description}
        </p>
      )}
    </div>
  );
}