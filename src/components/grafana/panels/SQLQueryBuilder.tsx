import { useState, useEffect } from "react";
import { ChevronDown, Plus, Trash2, Database, Table2, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  name: string;
  type: string;
}

interface TableSchema {
  name: string;
  columns: Column[];
}

interface SQLQueryBuilderProps {
  datasource: string;
  value: string;
  onChange: (query: string) => void;
}

// Mock schema data - in real app this would come from the data source
const mockSchemas: Record<string, TableSchema[]> = {
  postgres: [
    {
      name: "users",
      columns: [
        { name: "id", type: "serial" },
        { name: "email", type: "varchar" },
        { name: "name", type: "varchar" },
        { name: "created_at", type: "timestamp" },
        { name: "status", type: "varchar" },
        { name: "role", type: "varchar" },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "serial" },
        { name: "user_id", type: "integer" },
        { name: "total", type: "decimal" },
        { name: "status", type: "varchar" },
        { name: "created_at", type: "timestamp" },
        { name: "updated_at", type: "timestamp" },
      ],
    },
    {
      name: "products",
      columns: [
        { name: "id", type: "serial" },
        { name: "name", type: "varchar" },
        { name: "price", type: "decimal" },
        { name: "category", type: "varchar" },
        { name: "stock", type: "integer" },
        { name: "created_at", type: "timestamp" },
      ],
    },
    {
      name: "metrics",
      columns: [
        { name: "id", type: "serial" },
        { name: "timestamp", type: "timestamp" },
        { name: "cpu_usage", type: "float" },
        { name: "memory_usage", type: "float" },
        { name: "disk_usage", type: "float" },
        { name: "hostname", type: "varchar" },
      ],
    },
  ],
  mysql: [
    {
      name: "customers",
      columns: [
        { name: "id", type: "int" },
        { name: "name", type: "varchar" },
        { name: "email", type: "varchar" },
        { name: "phone", type: "varchar" },
        { name: "created_at", type: "datetime" },
      ],
    },
    {
      name: "transactions",
      columns: [
        { name: "id", type: "int" },
        { name: "customer_id", type: "int" },
        { name: "amount", type: "decimal" },
        { name: "type", type: "varchar" },
        { name: "timestamp", type: "datetime" },
      ],
    },
  ],
};

interface WhereCondition {
  column: string;
  operator: string;
  value: string;
}

export function SQLQueryBuilder({ datasource, value, onChange }: SQLQueryBuilderProps) {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["*"]);
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([]);
  const [orderBy, setOrderBy] = useState<string>("");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");
  const [limit, setLimit] = useState<string>("100");
  const [groupBy, setGroupBy] = useState<string>("");
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const tables = mockSchemas[datasource] || [];
  const currentTableSchema = tables.find((t) => t.name === selectedTable);
  const columns = currentTableSchema?.columns || [];

  // Generate SQL query from builder state
  useEffect(() => {
    if (!selectedTable) return;

    let query = "SELECT ";
    query += selectedColumns.length > 0 ? selectedColumns.join(", ") : "*";
    query += ` \nFROM ${selectedTable}`;

    if (whereConditions.length > 0) {
      const validConditions = whereConditions.filter((c) => c.column && c.value);
      if (validConditions.length > 0) {
        query += " \nWHERE " + validConditions.map((c) => `${c.column} ${c.operator} '${c.value}'`).join(" AND ");
      }
    }

    if (groupBy) {
      query += ` \nGROUP BY ${groupBy}`;
    }

    if (orderBy) {
      query += ` \nORDER BY ${orderBy} ${orderDirection}`;
    }

    if (limit) {
      query += ` \nLIMIT ${limit}`;
    }

    onChange(query);
  }, [selectedTable, selectedColumns, whereConditions, orderBy, orderDirection, limit, groupBy, onChange]);

  const toggleColumn = (columnName: string) => {
    if (columnName === "*") {
      setSelectedColumns(["*"]);
      return;
    }

    setSelectedColumns((prev) => {
      const filtered = prev.filter((c) => c !== "*");
      if (filtered.includes(columnName)) {
        const newCols = filtered.filter((c) => c !== columnName);
        return newCols.length === 0 ? ["*"] : newCols;
      }
      return [...filtered, columnName];
    });
  };

  const addWhereCondition = () => {
    setWhereConditions([...whereConditions, { column: "", operator: "=", value: "" }]);
  };

  const updateWhereCondition = (index: number, field: keyof WhereCondition, value: string) => {
    const updated = [...whereConditions];
    updated[index] = { ...updated[index], [field]: value };
    setWhereConditions(updated);
  };

  const removeWhereCondition = (index: number) => {
    setWhereConditions(whereConditions.filter((_, i) => i !== index));
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Database size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No schema available for {datasource}</p>
        <p className="text-xs mt-1">Switch to Code mode to write SQL manually</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Table2 size={12} />
          Table
        </label>
        <div className="relative">
          <button
            onClick={() => setShowTableDropdown(!showTableDropdown)}
            className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-left flex items-center justify-between hover:border-primary transition-colors"
          >
            <span className={selectedTable ? "text-foreground" : "text-muted-foreground"}>
              {selectedTable || "Select table..."}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          {showTableDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => {
                    setSelectedTable(table.name);
                    setSelectedColumns(["*"]);
                    setShowTableDropdown(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2",
                    selectedTable === table.name && "bg-secondary text-primary"
                  )}
                >
                  <Table2 size={14} className="text-muted-foreground" />
                  <span>{table.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{table.columns.length} columns</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTable && (
        <>
          {/* Column Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Columns3 size={12} />
              Columns
            </label>
            <div className="relative">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-left flex items-center justify-between hover:border-primary transition-colors"
              >
                <span className="truncate">
                  {selectedColumns.includes("*") ? "All columns (*)" : selectedColumns.join(", ")}
                </span>
                <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
              </button>
              {showColumnDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-auto">
                  <button
                    onClick={() => {
                      setSelectedColumns(["*"]);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2",
                      selectedColumns.includes("*") && "bg-secondary text-primary"
                    )}
                  >
                    <span className="font-mono">*</span>
                    <span className="text-muted-foreground">All columns</span>
                  </button>
                  <div className="border-t border-border" />
                  {columns.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => toggleColumn(col.name)}
                      className={cn(
                        "w-full px-3 py-2 text-sm text-left hover:bg-secondary flex items-center justify-between",
                        selectedColumns.includes(col.name) && !selectedColumns.includes("*") && "bg-secondary text-primary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col.name) && !selectedColumns.includes("*")}
                          readOnly
                          className="rounded border-border"
                        />
                        <span className="font-mono">{col.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{col.type}</span>
                    </button>
                  ))}
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={() => setShowColumnDropdown(false)}
                      className="w-full px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* WHERE Conditions */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">WHERE Conditions</label>
            <div className="space-y-2">
              {whereConditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={condition.column}
                    onChange={(e) => updateWhereCondition(index, "column", e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-input border border-border rounded text-sm"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateWhereCondition(index, "operator", e.target.value)}
                    className="w-20 px-2 py-1.5 bg-input border border-border rounded text-sm"
                  >
                    <option value="=">=</option>
                    <option value="!=">!=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                    <option value="LIKE">LIKE</option>
                    <option value="IN">IN</option>
                  </select>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateWhereCondition(index, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 bg-input border border-border rounded text-sm"
                  />
                  <button
                    onClick={() => removeWhereCondition(index)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addWhereCondition}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={12} />
                Add condition
              </button>
            </div>
          </div>

          {/* GROUP BY */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">GROUP BY</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-3 py-1.5 bg-input border border-border rounded text-sm"
              >
                <option value="">None</option>
                {columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* LIMIT */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">LIMIT</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-3 py-1.5 bg-input border border-border rounded text-sm"
              >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
                <option value="">No limit</option>
              </select>
            </div>
          </div>

          {/* ORDER BY */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">ORDER BY</label>
            <div className="flex gap-2">
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-input border border-border rounded text-sm"
              >
                <option value="">None</option>
                {columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
              <select
                value={orderDirection}
                onChange={(e) => setOrderDirection(e.target.value as "ASC" | "DESC")}
                className="w-24 px-3 py-1.5 bg-input border border-border rounded text-sm"
                disabled={!orderBy}
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
          </div>

          {/* Generated Query Preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Generated Query</label>
            <pre className="p-3 bg-secondary/50 border border-border rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">
              {value || "SELECT * FROM ..."}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
