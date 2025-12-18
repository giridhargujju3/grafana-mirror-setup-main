import { useState } from "react";
import { Globe, FileText, Settings, TestTube } from "lucide-react";
import { DataSource } from "@/contexts/DashboardContext";

interface CSVDataSourceConfigProps {
  dataSource: DataSource;
  onChange: (dataSource: DataSource) => void;
  onTest?: () => Promise<{ status: 'success' | 'error'; message: string }>;
}

export function CSVDataSourceConfig({ dataSource, onChange, onTest }: CSVDataSourceConfigProps) {
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleConfigChange = (field: string, value: any) => {
    const updatedDataSource = {
      ...dataSource,
      csvConfig: {
        ...dataSource.csvConfig,
        [field]: value
      }
    };
    onChange(updatedDataSource);
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await onTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
          <Settings size={20} />
          CSV Data Source Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={dataSource.name}
              onChange={(e) => onChange({ ...dataSource, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              placeholder="My CSV Data Source"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Default</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dataSource.isDefault || false}
                onChange={(e) => onChange({ ...dataSource, isDefault: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Use as default data source</span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-medium text-foreground flex items-center gap-2">
          <FileText size={18} />
          CSV Settings
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Default URL</label>
            <div className="flex gap-2">
              <Globe size={16} className="text-muted-foreground mt-2.5" />
              <input
                type="url"
                value={dataSource.csvConfig?.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground"
                placeholder="https://example.com/data.csv"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Delimiter</label>
            <select
              value={dataSource.csvConfig?.delimiter || ','}
              onChange={(e) => handleConfigChange('delimiter', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dataSource.csvConfig?.hasHeader !== false}
              onChange={(e) => handleConfigChange('hasHeader', e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm font-medium text-foreground">First row contains headers</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-foreground flex items-center gap-2">
            <TestTube size={18} />
            Test Connection
          </h4>
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Testing...
              </>
            ) : (
              <>
                <TestTube size={16} />
                Test & Save
              </>
            )}
          </button>
        </div>
        
        {testResult && (
          <div className={`p-3 rounded border ${
            testResult.status === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.status === 'success' ? (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
              <span className="text-sm font-medium">
                {testResult.status === 'success' ? 'Success' : 'Error'}
              </span>
            </div>
            <p className="text-sm mt-1">{testResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}