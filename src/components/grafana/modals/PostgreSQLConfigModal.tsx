import { useState } from "react";
import { X, Database, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PostgreSQLDataSource, PostgreSQLConfig } from "@/lib/postgresDataSource";

interface PostgreSQLConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: PostgreSQLConfig) => void;
  initialConfig?: PostgreSQLConfig;
}

export function PostgreSQLConfigModal({ isOpen, onClose, onSave, initialConfig }: PostgreSQLConfigModalProps) {
  const [config, setConfig] = useState<PostgreSQLConfig>({
    name: initialConfig?.name || "",
    host: initialConfig?.host || "localhost",
    port: initialConfig?.port || 5432,
    database: initialConfig?.database || "",
    user: initialConfig?.user || "",
    password: initialConfig?.password || "",
    sslMode: initialConfig?.sslMode || "disable",
    maxConnections: initialConfig?.maxConnections || 10,
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const dataSource = new PostgreSQLDataSource(config);
      const result = await dataSource.testConnection();
      setTestResult(result);
      
      if (result.success) {
        // Auto-save the data source after successful test
        try {
          const savedId = await dataSource.saveDataSource();
          console.log('Data source auto-saved with ID:', savedId);
          toast.success("Connection successful and data source saved!");
          onSave({ ...config, id: savedId });
        } catch (saveError) {
          console.error('Failed to save data source:', saveError);
          toast.success("Connection successful!");
          toast.error("Failed to save data source");
        }
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      setTestResult({ success: false, message });
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testResult?.success) {
      toast.error("Please test the connection first");
      return;
    }

    try {
      const dataSource = new PostgreSQLDataSource(config);
      const id = await dataSource.saveDataSource();
      onSave({ ...config, id });
      toast.success("PostgreSQL data source saved successfully!");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save data source";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Database className="text-primary" size={24} />
            <h2 className="text-xl font-semibold text-foreground">PostgreSQL Configuration</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Connection Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Connection</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My PostgreSQL DB"
                  className="w-full grafana-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Host</label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="localhost"
                  className="w-full grafana-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Port</label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                  placeholder="5432"
                  className="w-full grafana-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Database</label>
                <input
                  type="text"
                  value={config.database}
                  onChange={(e) => setConfig(prev => ({ ...prev, database: e.target.value }))}
                  placeholder="postgres"
                  className="w-full grafana-input"
                />
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Authentication</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">User</label>
                <input
                  type="text"
                  value={config.user}
                  onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
                  placeholder="postgres"
                  className="w-full grafana-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="password"
                  className="w-full grafana-input"
                />
              </div>
            </div>
          </div>

          {/* SSL Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">SSL Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">SSL Mode</label>
              <select
                value={config.sslMode}
                onChange={(e) => setConfig(prev => ({ ...prev, sslMode: e.target.value as any }))}
                className="w-full grafana-input"
              >
                <option value="disable">Disable</option>
                <option value="require">Require</option>
                <option value="verify-ca">Verify CA</option>
                <option value="verify-full">Verify Full</option>
              </select>
            </div>
          </div>

          {/* Connection Test */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Connection Test</h3>
              <button
                onClick={handleTest}
                disabled={testing || !config.host || !config.database || !config.user}
                className="grafana-btn grafana-btn-secondary"
              >
                {testing ? "Testing..." : "Test Connection"}
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg ${
                testResult.success ? "bg-grafana-green/20 text-grafana-green" : "bg-grafana-red/20 text-grafana-red"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span className="text-sm">{testResult.message}</span>
                </div>
                {testResult.success && (
                  <div className="text-sm text-muted-foreground">
                    Next, you can start to visualize data by{" "}
                    <button 
                      onClick={() => window.location.href = '/dashboards/new'}
                      className="text-primary hover:underline"
                    >
                      building a dashboard
                    </button>
                    , or by querying data in the{" "}
                    <button 
                      onClick={() => window.location.href = '/explore'}
                      className="text-primary hover:underline"
                    >
                      Explore view
                    </button>
                    .
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="grafana-btn grafana-btn-secondary">
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!testResult?.success}
            className="grafana-btn grafana-btn-primary"
          >
            {testResult?.success ? "Done" : "Save & Test"}
          </button>
        </div>
      </div>
    </div>
  );
}