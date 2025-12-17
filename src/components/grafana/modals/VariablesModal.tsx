import { useState } from "react";
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { useDashboard, DashboardVariable, VariableOption } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const variableTypes = [
  { value: "custom", label: "Custom", description: "Define static list of values" },
  { value: "query", label: "Query", description: "Variable values from a data source query" },
  { value: "datasource", label: "Data source", description: "Select from available data sources" },
  { value: "interval", label: "Interval", description: "Time interval variable" },
  { value: "textbox", label: "Text box", description: "Free text input" },
  { value: "constant", label: "Constant", description: "Hidden constant value" },
];

const defaultIntervals = ["1m", "5m", "10m", "30m", "1h", "6h", "12h", "1d", "7d", "14d", "30d"];

interface VariableEditorProps {
  variable: DashboardVariable;
  onUpdate: (variable: DashboardVariable) => void;
  onDelete: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function VariableEditor({ variable, onUpdate, onDelete, isExpanded, onToggle }: VariableEditorProps) {
  const [customValues, setCustomValues] = useState(
    variable.options.map(o => o.value).join(", ")
  );

  const handleCustomValuesChange = (values: string) => {
    setCustomValues(values);
    const options: VariableOption[] = values
      .split(",")
      .map(v => v.trim())
      .filter(Boolean)
      .map(v => ({ text: v, value: v, selected: v === variable.current }));
    onUpdate({ ...variable, options });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div 
        className="flex items-center gap-2 px-4 py-3 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={onToggle}
      >
        <GripVertical size={16} className="text-muted-foreground" />
        <div className="flex-1">
          <span className="font-medium">${variable.name}</span>
          <span className="text-muted-foreground ml-2 text-sm">
            ({variableTypes.find(t => t.value === variable.type)?.label || variable.type})
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={16} />
        </button>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <input
                type="text"
                value={variable.name}
                onChange={(e) => onUpdate({ ...variable, name: e.target.value.replace(/\s/g, "_") })}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Variable name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Label</label>
              <input
                type="text"
                value={variable.label}
                onChange={(e) => onUpdate({ ...variable, label: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Display label (optional)"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <select
              value={variable.type}
              onChange={(e) => {
                const type = e.target.value as DashboardVariable["type"];
                let options = variable.options;
                if (type === "interval") {
                  options = defaultIntervals.map(v => ({ text: v, value: v, selected: false }));
                }
                onUpdate({ ...variable, type, options });
              }}
              className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {variableTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {variable.type === "custom" && (
            <div>
              <label className="text-sm font-medium mb-1 block">Values (comma-separated)</label>
              <input
                type="text"
                value={customValues}
                onChange={(e) => handleCustomValuesChange(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="value1, value2, value3"
              />
            </div>
          )}

          {variable.type === "query" && (
            <div>
              <label className="text-sm font-medium mb-1 block">Query</label>
              <textarea
                value={variable.query || ""}
                onChange={(e) => onUpdate({ ...variable, query: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono min-h-[80px]"
                placeholder="label_values(up, instance)"
              />
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={variable.multi}
                onChange={(e) => onUpdate({ ...variable, multi: e.target.checked })}
                className="rounded border-border"
              />
              Multi-value
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={variable.includeAll}
                onChange={(e) => onUpdate({ ...variable, includeAll: e.target.checked })}
                className="rounded border-border"
              />
              Include All option
            </label>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Preview</label>
            <div className="flex flex-wrap gap-1">
              {variable.options.slice(0, 10).map((option) => (
                <span
                  key={option.value}
                  className="px-2 py-0.5 bg-secondary text-xs rounded"
                >
                  {option.text}
                </span>
              ))}
              {variable.options.length > 10 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  +{variable.options.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function VariablesModal() {
  const { showVariablesModal, setShowVariablesModal, dashboardVariables, setDashboardVariables, markDirty } = useDashboard();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!showVariablesModal) return null;

  const handleAddVariable = () => {
    const newVariable: DashboardVariable = {
      name: `variable${dashboardVariables.length + 1}`,
      label: "",
      type: "custom",
      current: "",
      options: [],
      multi: false,
      includeAll: false,
    };
    setDashboardVariables([...dashboardVariables, newVariable]);
    setExpandedIndex(dashboardVariables.length);
    markDirty();
  };

  const handleUpdateVariable = (index: number, variable: DashboardVariable) => {
    const updated = [...dashboardVariables];
    updated[index] = variable;
    setDashboardVariables(updated);
    markDirty();
  };

  const handleDeleteVariable = (index: number) => {
    setDashboardVariables(dashboardVariables.filter((_, i) => i !== index));
    markDirty();
    toast.success("Variable deleted");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowVariablesModal(false)}
      />
      <div className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Dashboard Variables</h2>
            <p className="text-sm text-muted-foreground">
              Variables enable dynamic dashboards. Use $variable_name in your queries.
            </p>
          </div>
          <button
            onClick={() => setShowVariablesModal(false)}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {dashboardVariables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No variables defined yet.</p>
              <button onClick={handleAddVariable} className="grafana-btn grafana-btn-primary">
                <Plus size={16} />
                Add variable
              </button>
            </div>
          ) : (
            <>
              {dashboardVariables.map((variable, index) => (
                <VariableEditor
                  key={index}
                  variable={variable}
                  onUpdate={(v) => handleUpdateVariable(index, v)}
                  onDelete={() => handleDeleteVariable(index)}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button onClick={handleAddVariable} className="grafana-btn grafana-btn-secondary">
            <Plus size={16} />
            New variable
          </button>
          <button
            onClick={() => setShowVariablesModal(false)}
            className="grafana-btn grafana-btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
