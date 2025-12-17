import { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";
import { useDashboard, DashboardVariable } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

interface VariableDropdownProps {
  variable: DashboardVariable;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

function VariableDropdown({ variable, value, onChange }: VariableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = Array.isArray(value) 
    ? value.length > 1 ? `${value.length} selected` : value[0] || "Select..."
    : value || "Select...";

  const handleSelect = (optionValue: string) => {
    if (variable.multi) {
      const currentValues = Array.isArray(value) ? value : [value].filter(Boolean);
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{variable.label || variable.name}:</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-sm bg-secondary/50 border border-border rounded hover:bg-secondary transition-colors min-w-[100px] justify-between",
            isOpen && "ring-1 ring-ring"
          )}
        >
          <span className="truncate max-w-[120px]">{displayValue}</span>
          <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[150px] bg-popover border border-border rounded-md shadow-lg z-[100] py-1 animate-fade-in max-h-60 overflow-y-auto">
          {variable.includeAll && (
            <button
              onClick={() => handleSelect("$__all")}
              className={cn(
                "w-full px-3 py-1.5 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2",
                isSelected("$__all") && "bg-secondary text-primary"
              )}
            >
              {variable.multi && (
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isSelected("$__all") ? "bg-primary border-primary" : "border-muted-foreground"
                )}>
                  {isSelected("$__all") && <span className="text-primary-foreground text-xs">✓</span>}
                </div>
              )}
              All
            </button>
          )}
          {variable.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full px-3 py-1.5 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2",
                isSelected(option.value) && "bg-secondary text-primary"
              )}
            >
              {variable.multi && (
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isSelected(option.value) ? "bg-primary border-primary" : "border-muted-foreground"
                )}>
                  {isSelected(option.value) && <span className="text-primary-foreground text-xs">✓</span>}
                </div>
              )}
              {option.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VariablesBar() {
  const { dashboardVariables, variableValues, setVariableValue, isEditMode, setShowVariablesModal } = useDashboard();

  if (dashboardVariables.length === 0) {
    return null;
  }

  return (
    <div className="h-10 bg-card/50 border-b border-border flex items-center px-4 gap-4">
      {dashboardVariables.map((variable) => (
        <VariableDropdown
          key={variable.name}
          variable={variable}
          value={variableValues[variable.name] || variable.current}
          onChange={(value) => setVariableValue(variable.name, value)}
        />
      ))}
      
      {isEditMode && (
        <button
          onClick={() => setShowVariablesModal(true)}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit variables
        </button>
      )}
    </div>
  );
}
