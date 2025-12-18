import { useState, useCallback, useEffect } from "react";
import { X, Save, Copy, Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "sonner";

interface JSONEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JSONEditorModal({ isOpen, onClose }: JSONEditorModalProps) {
  const { 
    panels, 
    setPanels, 
    dashboardTitle, 
    setDashboardTitle,
    dashboardTags,
    setDashboardTags,
    timeRange,
    refreshInterval,
    markDirty,
    saveDashboard
  } = useDashboard();

  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Generate dashboard JSON
  const generateDashboardJSON = useCallback(() => {
    const dashboardJSON = {
      id: null,
      uid: `dashboard-${Date.now()}`,
      title: dashboardTitle,
      tags: dashboardTags,
      timezone: "browser",
      panels: panels.map(panel => ({
        ...panel,
        gridPos: panel.gridPos,
        targets: panel.targets || []
      })),
      time: {
        from: timeRange,
        to: "now"
      },
      timepicker: {},
      templating: {
        list: []
      },
      annotations: {
        list: []
      },
      refresh: refreshInterval,
      schemaVersion: 39,
      version: 1,
      links: [],
      gnetId: null,
      description: ""
    };
    return JSON.stringify(dashboardJSON, null, 2);
  }, [panels, dashboardTitle, dashboardTags, timeRange, refreshInterval]);

  // Initialize JSON when modal opens
  useEffect(() => {
    if (isOpen) {
      const json = generateDashboardJSON();
      setJsonText(json);
      setError(null);
      setIsValid(true);
    }
  }, [isOpen, generateDashboardJSON]);

  // Validate JSON
  const validateJSON = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      
      // Basic validation
      if (!parsed.panels || !Array.isArray(parsed.panels)) {
        throw new Error("Dashboard must have a 'panels' array");
      }
      
      if (!parsed.title || typeof parsed.title !== 'string') {
        throw new Error("Dashboard must have a 'title' string");
      }

      setError(null);
      setIsValid(true);
      return parsed;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid JSON format';
      setError(errorMsg);
      setIsValid(false);
      return null;
    }
  }, []);

  // Handle JSON text change
  const handleJSONChange = useCallback((value: string) => {
    setJsonText(value);
    validateJSON(value);
  }, [validateJSON]);

  // Apply JSON changes to dashboard
  const applyJSON = useCallback(() => {
    const parsed = validateJSON(jsonText);
    if (!parsed) return;

    try {
      // Update dashboard properties
      if (parsed.title) setDashboardTitle(parsed.title);
      if (parsed.tags) setDashboardTags(parsed.tags);
      
      // Update panels
      if (parsed.panels) {
        const validPanels = parsed.panels.filter((panel: any) => 
          panel.id && panel.type && panel.gridPos
        );
        setPanels(validPanels);
      }

      markDirty();
      toast.success("Dashboard updated from JSON");
      onClose();
    } catch (err) {
      toast.error("Failed to apply JSON changes");
    }
  }, [jsonText, validateJSON, setDashboardTitle, setDashboardTags, setPanels, markDirty, onClose]);

  // Copy JSON to clipboard
  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(jsonText);
    toast.success("JSON copied to clipboard");
  }, [jsonText]);

  // Download JSON file
  const downloadJSON = useCallback(() => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboardTitle.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dashboard JSON downloaded");
  }, [jsonText, dashboardTitle]);

  // Load JSON from file
  const loadJSONFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleJSONChange(content);
    };
    reader.readAsText(file);
  }, [handleJSONChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 bg-card border border-border rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Dashboard JSON</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              {isValid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-sm">Valid JSON</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle size={16} />
                  <span className="text-sm">Invalid JSON</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={loadJSONFile}
                className="hidden"
                id="json-upload"
              />
              <label
                htmlFor="json-upload"
                className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary transition-colors cursor-pointer flex items-center gap-1"
              >
                <Upload size={14} />
                Load
              </label>
              
              <button
                onClick={copyJSON}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary transition-colors flex items-center gap-1"
              >
                <Copy size={14} />
                Copy
              </button>
              
              <button
                onClick={downloadJSON}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-secondary transition-colors flex items-center gap-1"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>

          {/* JSON Editor */}
          <div className="flex-1 p-6">
            <textarea
              value={jsonText}
              onChange={(e) => handleJSONChange(e.target.value)}
              className="w-full h-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Dashboard JSON..."
              spellCheck={false}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6 py-3 border-t border-border bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">JSON Error:</span>
              </div>
              <p className="text-sm text-destructive mt-1">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border text-foreground rounded text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applyJSON}
              disabled={!isValid}
              className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              Apply JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}