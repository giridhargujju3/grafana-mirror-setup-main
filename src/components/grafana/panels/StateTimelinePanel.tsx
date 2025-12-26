import { MoreVertical } from "lucide-react";

interface StateTimelinePanelProps {
  title: string;
  data?: Array<{startTime: number; endTime: number; state: string; value: string}>;
  panelId?: string;
}

const stateColors = [
  'hsl(var(--grafana-blue))',
  'hsl(var(--grafana-green))',
  'hsl(var(--grafana-orange))',
  'hsl(var(--grafana-purple))',
  'hsl(var(--grafana-yellow))',
  'hsl(var(--grafana-red))',
];

export function StateTimelinePanel({ title, data = [] }: StateTimelinePanelProps) {
  const generateSampleData = () => {
    const states = ['Running', 'Idle', 'Processing', 'Error', 'Stopped'];
    const result: Array<{startTime: number; endTime: number; state: string; value: string}> = [];
    let currentTime = 0;
    
    for (let i = 0; i < 20; i++) {
      const duration = Math.random() * 5000 + 1000;
      const state = states[Math.floor(Math.random() * states.length)];
      result.push({
        startTime: currentTime,
        endTime: currentTime + duration,
        state,
        value: state
      });
      currentTime += duration;
    }
    
    return result;
  };

  const timelineData = data.length > 0 ? data : generateSampleData();
  
  const states = [...new Set(timelineData.map(d => d.state))];
  const colorMap = Object.fromEntries(states.map((state, i) => [state, stateColors[i % stateColors.length]]));
  
  const minTime = Math.min(...timelineData.map(d => d.startTime));
  const maxTime = Math.max(...timelineData.map(d => d.endTime));
  const timeRange = maxTime - minTime;
  
  const getXPosition = (time: number) => ((time - minTime) / timeRange) * 100;
  const getWidth = (start: number, end: number) => ((end - start) / timeRange) * 100;

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
          <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              {states.map((state, idx) => (
                <linearGradient key={state} id={`state-gradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colorMap[state]} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={colorMap[state]} stopOpacity="0.6" />
                </linearGradient>
              ))}
            </defs>
            
            {timelineData.map((segment, idx) => {
              const x = getXPosition(segment.startTime);
              const width = getWidth(segment.startTime, segment.endTime);
              const stateIdx = states.indexOf(segment.state);
              
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={2}
                    width={width}
                    height={16}
                    fill={`url(#state-gradient-${stateIdx})`}
                    stroke={colorMap[segment.state]}
                    strokeWidth="0.3"
                    rx="0.5"
                    className="transition-all duration-200 hover:opacity-80"
                  >
                    <title>{`${segment.state}: ${((segment.endTime - segment.startTime) / 1000).toFixed(1)}s`}</title>
                  </rect>
                  {width > 5 && (
                    <text
                      x={x + width / 2}
                      y={11}
                      textAnchor="middle"
                      fill="white"
                      fontSize="2"
                      fontWeight="600"
                      className="pointer-events-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {segment.state}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 py-2 text-xs text-muted-foreground bg-gradient-to-t from-background/80 to-transparent pointer-events-none">
            <span>0s</span>
            <span>{((timeRange / 2) / 1000).toFixed(1)}s</span>
            <span>{(timeRange / 1000).toFixed(1)}s</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs border-t border-border bg-secondary/20">
          <span className="text-muted-foreground">States:</span>
          {states.map(state => (
            <div key={state} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{backgroundColor: colorMap[state]}} />
              <span className="text-foreground font-medium">{state}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
