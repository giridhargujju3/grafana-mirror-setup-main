import { MoreVertical, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  labels?: Record<string, string>;
}

interface LogsPanelProps {
  title: string;
  logs: LogEntry[];
  panelId?: string;
}

const levelConfig = {
  info: { color: "text-grafana-blue", bg: "bg-grafana-blue/10" },
  warn: { color: "text-grafana-yellow", bg: "bg-grafana-yellow/10" },
  error: { color: "text-grafana-red", bg: "bg-grafana-red/10" },
  debug: { color: "text-grafana-purple", bg: "bg-grafana-purple/10" },
};

export function LogsPanel({ title, logs }: LogsPanelProps) {
  return (
    <div className="grafana-panel h-full flex flex-col">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
            <Maximize2 size={14} />
          </button>
          <button className="p-1 rounded hover:bg-secondary/50 text-muted-foreground">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto font-mono text-xs">
        {logs.map((log, i) => {
          const config = levelConfig[log.level];
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-2 hover:bg-secondary/30 border-b border-border/30"
            >
              <span className="text-muted-foreground whitespace-nowrap">
                {log.timestamp}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded uppercase font-medium",
                  config.bg,
                  config.color
                )}
              >
                {log.level}
              </span>
              <span className="text-foreground flex-1 break-all">
                {log.message}
              </span>
              {log.labels && (
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(log.labels).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-1.5 py-0.5 bg-secondary rounded text-muted-foreground"
                    >
                      {key}={value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
