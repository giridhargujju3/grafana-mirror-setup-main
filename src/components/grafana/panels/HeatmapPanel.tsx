import { MoreVertical } from "lucide-react";

interface HeatmapPanelProps {
  title: string;
  data?: Array<{time: string; value: number; category: string}>;
  panelId?: string;
}

export function HeatmapPanel({ title, data = [] }: HeatmapPanelProps) {
  const generateSampleData = () => {
    const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
    const times = Array.from({length: 24}, (_, i) => `${i}:00`);
    return times.flatMap(time => 
      categories.map(category => ({
        time,
        category,
        value: Math.random() * 100
      }))
    );
  };

  const heatmapData = data.length > 0 ? data : generateSampleData();
  
  const categories = [...new Set(heatmapData.map(d => d.category))];
  const times = [...new Set(heatmapData.map(d => d.time))];
  
  const maxValue = Math.max(...heatmapData.map(d => d.value));
  const minValue = Math.min(...heatmapData.map(d => d.value));
  
  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    const hue = 216;
    const saturation = 73;
    const lightness = 25 + normalized * 40;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const cellWidth = 100 / times.length;
  const cellHeight = 100 / categories.length;

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
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {heatmapData.map((cell, idx) => {
              const xIndex = times.indexOf(cell.time);
              const yIndex = categories.indexOf(cell.category);
              return (
                <rect
                  key={idx}
                  x={xIndex * cellWidth}
                  y={yIndex * cellHeight}
                  width={cellWidth}
                  height={cellHeight}
                  fill={getColor(cell.value)}
                  stroke="hsl(var(--background))"
                  strokeWidth="0.2"
                  className="transition-all duration-200 hover:opacity-80"
                >
                  <title>{`${cell.category} at ${cell.time}: ${cell.value.toFixed(1)}`}</title>
                </rect>
              );
            })}
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 py-2 text-xs text-muted-foreground bg-gradient-to-t from-background/80 to-transparent pointer-events-none">
            <span>{times[0]}</span>
            <span>{times[Math.floor(times.length / 2)]}</span>
            <span>{times[times.length - 1]}</span>
          </div>
          
          <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-around py-2 text-xs text-muted-foreground pointer-events-none">
            {categories.map(cat => (
              <div key={cat} className="px-2 bg-background/60 backdrop-blur-sm rounded-r text-[10px]">
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
