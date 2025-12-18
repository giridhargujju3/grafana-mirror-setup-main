import { Plus, Upload, Library, Database } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

export function EmptyDashboardState() {
  const { setShowDataSourceSelector, setShowCSVImportModal } = useDashboard();

  const handleAddVisualization = () => {
    // Show data source selector first, which will then open panel editor
    setShowDataSourceSelector(true);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Main Add Visualization Card */}
        <div className="border border-dashed border-border rounded-lg p-12 text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Start your new dashboard by adding a visualization
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Select a data source and then query and visualize your data with charts, stats and tables or create lists, markdowns and other widgets.
          </p>
          <button
            onClick={handleAddVisualization}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Add visualization
          </button>
        </div>

        {/* Secondary Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CSV Import Card */}
          <div className="border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Import CSV data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload CSV files or paste data to create visualizations.
            </p>
            <button 
              onClick={() => setShowCSVImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Database size={16} />
              Import CSV
            </button>
          </div>
          {/* Import Panel Card */}
          <div className="border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Import panel</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add visualizations that are shared with other dashboards.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 transition-colors">
              <Library size={16} />
              Add library panel
            </button>
          </div>

          {/* Import Dashboard Card */}
          <div className="border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Import a dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import dashboards from files or <span className="text-primary">grafana.com</span>.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-secondary transition-colors">
              <Upload size={16} />
              Import dashboard
            </button>
          </div>
        </div>
      </div>
      

    </div>
  );
}
