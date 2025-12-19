import { GrafanaSidebar } from "@/components/grafana/GrafanaSidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { useState } from "react";
import { Plus, Upload, FileText, Settings, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

function NewDashboardContent() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <GrafanaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground">New dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="grafana-btn grafana-btn-secondary">
              <Plus size={16} />
              Add
            </button>
            <button className="grafana-btn grafana-btn-secondary">
              <Settings size={16} />
              Settings
            </button>
            <button className="grafana-btn grafana-btn-primary">
              <Save size={16} />
              Save dashboard
            </button>
          </div>
        </header>

        {/* Time controls */}
        <div className="h-12 bg-card border-b border-border flex items-center justify-end px-6 gap-2">
          <select className="grafana-input text-sm">
            <option>Last 6 hours</option>
            <option>Last 12 hours</option>
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
          </select>
          <button className="grafana-btn grafana-btn-secondary text-sm">
            Refresh
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Add visualization section */}
          <div className="border-2 border-dashed border-border rounded-lg p-12 mb-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Start your new dashboard by adding a visualization
              </h2>
              <p className="text-muted-foreground mb-8">
                Select a data source and then query and visualize your data with charts, stats and tables or create lists, 
                markdowns and other widgets.
              </p>
              <button 
                onClick={() => navigate('/dashboard/new/panel-editor')}
                className="grafana-btn grafana-btn-primary text-lg px-8 py-3"
              >
                <Plus size={20} />
                Add visualization
              </button>
            </div>
          </div>

          {/* Import options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-6 text-center">
              <div className="mb-4">
                <FileText size={48} className="mx-auto text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Import panel</h3>
              <p className="text-muted-foreground mb-4">
                Add visualizations that are shared with other dashboards.
              </p>
              <button className="grafana-btn grafana-btn-secondary">
                <Plus size={16} />
                Add library panel
              </button>
            </div>

            <div className="border border-border rounded-lg p-6 text-center">
              <div className="mb-4">
                <Upload size={48} className="mx-auto text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Import a dashboard</h3>
              <p className="text-muted-foreground mb-4">
                Import dashboards from files or grafana.com.
              </p>
              <button className="grafana-btn grafana-btn-secondary">
                <Upload size={16} />
                Import dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function NewDashboardPage() {
  return (
    <DashboardProvider isNewDashboard={true}>
      <NewDashboardContent />
    </DashboardProvider>
  );
}