import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NexusLogoProps {
  size?: number;
  animate?: boolean;
  showText?: boolean;
  className?: string;
}

export function NexusLogo({ size = 32, animate = true, showText = false, className }: NexusLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hexagonSize = size / 3.5;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const positions = [
    { x: 0, y: -1.5, delay: 0 },
    { x: 1.3, y: -0.75, delay: 0.1 },
    { x: 1.3, y: 0.75, delay: 0.2 },
    { x: 0, y: 1.5, delay: 0.3 },
    { x: -1.3, y: 0.75, delay: 0.4 },
    { x: -1.3, y: -0.75, delay: 0.5 },
  ];

  const createHexagonPath = (cx: number, cy: number, size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(" L ")} Z`;
  };

  return (
    <div 
      className={cn("inline-flex items-center gap-2", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="nexus-logo"
        style={{
          filter: "drop-shadow(0 2px 8px rgba(14, 165, 233, 0.3))",
        }}
      >
        <defs>
          <linearGradient id="nexus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1">
              <animate
                attributeName="stopColor"
                values="#0ea5e9; #06b6d4; #0ea5e9"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="1">
              <animate
                attributeName="stopColor"
                values="#06b6d4; #22d3ee; #06b6d4"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {positions.map((pos, index) => {
          const cx = centerX + pos.x * hexagonSize * 1.5;
          const cy = centerY + pos.y * hexagonSize * 1.5;
          
          return (
            <g key={index}>
              <path
                d={createHexagonPath(cx, cy, hexagonSize)}
                fill="url(#nexus-gradient)"
                stroke="url(#nexus-gradient)"
                strokeWidth="0.5"
                opacity="0.15"
                className={animate ? "nexus-hex-bg" : ""}
                style={{
                  animationDelay: `${pos.delay}s`,
                }}
              />
              <path
                d={createHexagonPath(cx, cy, hexagonSize * 0.7)}
                fill="none"
                stroke="url(#nexus-gradient)"
                strokeWidth="1.5"
                className={animate ? "nexus-hex" : ""}
                style={{
                  animationDelay: `${pos.delay}s`,
                  strokeDasharray: animate ? "100" : "none",
                  strokeDashoffset: animate ? "100" : "0",
                }}
              />
            </g>
          );
        })}

        <circle
          cx={centerX}
          cy={centerY}
          r={hexagonSize * 0.4}
          fill="url(#nexus-gradient)"
          className={animate ? "nexus-core" : ""}
          filter="url(#glow)"
        />
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] bg-clip-text text-transparent">
            Nexus
          </span>
          <span className="text-xs text-muted-foreground tracking-wide font-medium">
            Analytics
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-hex {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes draw-hex {
          0% { stroke-dashoffset: 100; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.8; }
        }

        @keyframes pulse-core {
          0%, 100% { opacity: 0.9; r: ${hexagonSize * 0.4}; }
          50% { opacity: 1; r: ${hexagonSize * 0.5}; }
        }

        @keyframes bg-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }

        .nexus-hex {
          animation: ${animate && !isHovered ? 'draw-hex 2s ease-in-out infinite' : 'none'};
        }

        .nexus-hex-bg {
          animation: ${animate && isHovered ? 'bg-pulse 1.5s ease-in-out infinite' : 'none'};
        }

        .nexus-core {
          animation: ${animate ? 'pulse-core 2s ease-in-out infinite' : 'none'};
          transition: all 0.3s ease;
        }

        .nexus-logo:hover .nexus-core {
          filter: url(#glow) drop-shadow(0 0 10px rgba(14, 165, 233, 0.8));
        }

        .nexus-logo:hover .nexus-hex {
          stroke-width: 2;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
