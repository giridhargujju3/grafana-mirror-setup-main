import { X, Search, LayoutDashboard, Compass, Bell, Database, Settings, Clock } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const searchSuggestions = [
  { type: "dashboard", title: "System Monitoring", icon: LayoutDashboard, href: "/" },
  { type: "dashboard", title: "Network Overview", icon: LayoutDashboard, href: "/dashboards" },
  { type: "dashboard", title: "Application Metrics", icon: LayoutDashboard, href: "/dashboards" },
  { type: "page", title: "Explore", icon: Compass, href: "/explore" },
  { type: "page", title: "Alerting", icon: Bell, href: "/alerting" },
  { type: "page", title: "Data Sources", icon: Database, href: "/connections/datasources" },
  { type: "page", title: "Administration", icon: Settings, href: "/admin" },
];

const recentSearches = [
  "CPU usage",
  "Memory metrics",
  "Error rate",
  "Network latency",
];

export function SearchModal() {
  const { showSearchModal, setShowSearchModal, searchQuery, setSearchQuery } = useDashboard();
  const [filteredResults, setFilteredResults] = useState(searchSuggestions);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchSuggestions.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResults(filtered);
    } else {
      setFilteredResults(searchSuggestions);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setShowSearchModal]);

  if (!showSearchModal) return null;

  const handleSelect = (href: string) => {
    navigate(href);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowSearchModal(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-lg shadow-2xl animate-fade-in overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dashboards, panels, and more..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
            autoFocus
          />
          <button
            onClick={() => setShowSearchModal(false)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!searchQuery && (
            <div className="px-4 py-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Recent searches
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setSearchQuery(search)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-sm text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Clock size={12} />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-2 py-2">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {searchQuery ? "Results" : "Quick navigation"}
            </div>
            {filteredResults.length > 0 ? (
              filteredResults.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary transition-colors text-left"
                >
                  <div className="p-1.5 rounded bg-secondary">
                    <item.icon size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{item.type}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-secondary rounded">↑↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-secondary rounded">↵</kbd> to select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-secondary rounded">esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
