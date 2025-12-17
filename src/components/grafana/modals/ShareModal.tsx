import { X, Link2, Copy, Mail, Code, Download } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = ["Link", "Snapshot", "Export", "Embed"];

export function ShareModal() {
  const { showShareModal, setShowShareModal, dashboardTitle } = useDashboard();
  const [activeTab, setActiveTab] = useState("Link");
  const [shortenUrl, setShortenUrl] = useState(false);
  const [includeTimeRange, setIncludeTimeRange] = useState(true);
  const [includeVariables, setIncludeVariables] = useState(true);

  if (!showShareModal) return null;

  const dashboardUrl = `${window.location.origin}${window.location.pathname}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dashboardUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting as ${format}...`);
    setShowShareModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowShareModal(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-lg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Share {dashboardTitle}</h2>
          <button
            onClick={() => setShowShareModal(false)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === "Link" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dashboard URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dashboardUrl}
                    readOnly
                    className="flex-1 grafana-input"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="grafana-btn grafana-btn-primary"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shortenUrl}
                    onChange={(e) => setShortenUrl(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Shorten URL</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTimeRange}
                    onChange={(e) => setIncludeTimeRange(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Lock time range</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeVariables}
                    onChange={(e) => setIncludeVariables(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Lock template variables</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "Snapshot" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A snapshot is an instant way to share an interactive dashboard publicly. When created, 
                we strip sensitive data like queries and panel links, leaving only the visible metric 
                data and series names embedded in your dashboard.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Snapshot name
                </label>
                <input
                  type="text"
                  defaultValue={dashboardTitle}
                  className="w-full grafana-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expire
                </label>
                <select className="w-full grafana-input">
                  <option>Never</option>
                  <option>1 Hour</option>
                  <option>1 Day</option>
                  <option>7 Days</option>
                </select>
              </div>
              <button className="grafana-btn grafana-btn-primary w-full">
                Publish Snapshot
              </button>
            </div>
          )}

          {activeTab === "Export" && (
            <div className="space-y-3">
              <button
                onClick={() => handleExport("JSON")}
                className="w-full flex items-center gap-3 p-3 rounded border border-border hover:bg-secondary transition-colors"
              >
                <Download size={20} className="text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Export for sharing</div>
                  <div className="text-sm text-muted-foreground">
                    Export dashboard JSON, useful for sharing across instances
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleExport("PDF")}
                className="w-full flex items-center gap-3 p-3 rounded border border-border hover:bg-secondary transition-colors"
              >
                <Download size={20} className="text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Export as PDF</div>
                  <div className="text-sm text-muted-foreground">
                    Generate a PDF report of the current dashboard
                  </div>
                </div>
              </button>
            </div>
          )}

          {activeTab === "Embed" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Embed this dashboard in an external website using an iframe.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Embed code
                </label>
                <textarea
                  readOnly
                  value={`<iframe src="${dashboardUrl}?kiosk" width="100%" height="600" frameborder="0"></iframe>`}
                  className="w-full h-24 grafana-input font-mono text-xs"
                />
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="${dashboardUrl}?kiosk" width="100%" height="600" frameborder="0"></iframe>`);
                  toast.success("Embed code copied!");
                }}
                className="grafana-btn grafana-btn-secondary"
              >
                <Code size={16} />
                Copy embed code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
