import { MoreVertical } from "lucide-react";

interface StatusHistoryPanelProps {
  title: string;
  data?: Array<{time: string; status: 'ok' | 'warning' | 'error' | 'unknown'; service: string}>;
  panelId?: string;
}

const statusColors = {
  ok: 'hsl(var(--grafana-green))',
  warning: 'hsl(var(--grafana-yellow))',
  error: 'hsl(var(--grafana-red))',
  unknown: 'hsl(var(--muted))'
};

export function StatusHistoryPanel({ title, data = [] }: StatusHistoryPanelProps) {
  const generateSampleData = () => {
    const services = ['API Server', 'Database', 'Cache', 'Worker'];
    const statuses: Array<'ok' | 'warning' | 'error' | 'unknown'> = ['ok', 'warning', 'error', 'unknown'];
    const times = Array.from({length: 48}, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = (i % 2) * 30;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });
    
    return times.flatMap(time => 
      services.map(service => ({
        time,
        service,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      }))
    );
  };

  const statusData = data.length > 0 ? data : generateSampleData();
  
  const services = [...new Set(statusData.map(d => d.service))];
  const times = [...new Set(statusData.map(d => d.time))];
  
  const cellWidth = 100 / times.length;
  const cellHeight = 100 / services.length;

  return (
    <div className="grafana-panel h-full flex flex-col group">
      <div className="grafana-panel-header">
        <h3 className="grafana-panel-title">{title}</h3>
        <div className="panel-header-actions">
          <button className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={14} />
          </button>
        </div>
      </div>
      <div className="grafana-panel-content flex-1 min-h-0 overflow-auto">
        <div className="w-full h-full relative">
          <div className="absolute top-0 left-0 bottom-0 w-32 flex flex-col justify-around py-2 text-xs font-medium text-foreground bg-background/90 backdrop-blur-sm border-r border-border z-10">
            {services.map(service => (
              <div key={service} className="px-3 py-1 truncate">
                {service}
              </div>
            ))}
          </div>
          
          <div className="ml-32 h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              {statusData.map((cell, idx) => {
                const xIndex = times.indexOf(cell.time);
                const yIndex = services.indexOf(cell.service);
                return (
                  <rect
                    key={idx}
                    x={xIndex * cellWidth}
                    y={yIndex * cellHeight}
                    width={cellWidth}
                    height={cellHeight}
                    fill={statusColors[cell.status]}
                    stroke="hsl(var(--background))"
                    strokeWidth="0.1"
                    className="transition-all duration-200 hover:opacity-80"
                  >
                    <title>{`${cell.service} at ${cell.time}: ${cell.status.toUpperCase()}`}</title>
                  </rect>
                );
              })}
            </svg>
          </div>
          
          <div className="absolute bottom-0 left-32 right-0 flex justify-between px-4 py-2 text-xs text-muted-foreground bg-gradient-to-t from-background/80 to-transparent pointer-events-none">
            <span>{times[0]}</span>
            <span>{times[Math.floor(times.length / 2)]}</span>
            <span>{times[times.length - 1]}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-4 py-2 text-xs border-t border-border bg-secondary/20">
          <span className="text-muted-foreground">Legend:</span>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{backgroundColor: color}} />
              <span className="capitalize text-foreground">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
