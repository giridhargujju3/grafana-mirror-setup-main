import { useState, useRef, useEffect } from "react";
import { Edit, Copy, Trash2, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Maximize2, Minimize2, GripVertical } from "lucide-react";
import { useDashboard, PanelConfig } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PanelWrapperProps {
  panel: PanelConfig;
  children: React.ReactNode;
  dragHandleProps?: any;
}

export function PanelWrapper({ panel, children, dragHandleProps }: PanelWrapperProps) {
  const { 
    isEditMode, 
    setEditingPanel, 
    setShowPanelEditor, 
    removePanel, 
    duplicatePanel,
    movePanel,
    updatePanel,
    showPanelEditor
  } = useDashboard();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeRef = useRef({ 
    startX: 0, 
    startY: 0, 
    startW: 0, 
    startH: 0, 
    initialGridW: 0, 
    initialGridH: 0,
    gridX: 0,
    gridY: 0,
    lastUpdateTime: 0
  });

  const handleEdit = () => {
    setEditingPanel(panel);
    setShowPanelEditor(true);
    setShowMenu(false);
  };

  const handleDuplicate = () => {
    duplicatePanel(panel.id);
    toast.success("Panel duplicated");
    setShowMenu(false);
  };

  const handleRemove = () => {
    removePanel(panel.id);
    toast.success("Panel removed");
    setShowMenu(false);
  };

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    movePanel(panel.id, direction);
    setShowMoveMenu(false);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    setShowMenu(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!panelRef.current) return;

    setIsResizing(true);
    const rect = panelRef.current.getBoundingClientRect();
    
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      initialGridW: panel.gridPos.w,
      initialGridH: panel.gridPos.h,
      gridX: panel.gridPos.x,
      gridY: panel.gridPos.y,
      lastUpdateTime: 0
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!panelRef.current) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!panelRef.current) return;
      
      const { startX, startY, startW, initialGridW, initialGridH, gridX, gridY, lastUpdateTime } = resizeRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const pixelsPerCol = initialGridW > 0 ? startW / initialGridW : 100;
      const colDelta = Math.round(deltaX / pixelsPerCol);
      const newGridW = Math.max(2, Math.min(12, initialGridW + colDelta));

      const pixelsPerRow = 72;
      const rowDelta = Math.round(deltaY / pixelsPerRow);
      const newGridH = Math.max(2, initialGridH + rowDelta);

      const newHeight = newGridH * 72;
      const newWidth = (newGridW / 12) * 100;
      
      panelRef.current.style.height = `${newHeight}px`;
      panelRef.current.style.width = `${newWidth}%`;

      const now = Date.now();
      if ((newGridW !== panel.gridPos.w || newGridH !== panel.gridPos.h) && (now - lastUpdateTime > 50)) {
        resizeRef.current.lastUpdateTime = now;
        updatePanel(panel.id, { 
          gridPos: { x: gridX, y: gridY, w: newGridW, h: newGridH } 
        });
      }
    });
  };

  const handleResizeEnd = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (panelRef.current) {
      panelRef.current.style.height = '';
      panelRef.current.style.width = '';
    }
    document.body.style.cursor = '';
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  return (
    <>
      {isMaximized && (
        <div className="fixed inset-0 z-[100] bg-background p-4 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h2 className="text-lg font-semibold">{panel.title}</h2>
            <button
              onClick={toggleMaximize}
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              title="Minimize"
            >
              <Minimize2 size={20} />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </div>
      )}

      <div 
        ref={panelRef}
        className={cn(
          "h-full relative group",
          isEditMode && "ring-2 ring-transparent hover:ring-primary/50 hover:shadow-lg rounded-lg transition-all duration-200"
        )}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleMaximize();
        }}
      >
        {children}
        
        {/* Resize Handle - MUST render BEFORE drag overlay for proper event handling */}
        {isEditMode && !showPanelEditor && (
          <div
            ref={resizeHandleRef}
            className="resize-handle absolute bottom-0 right-0 cursor-se-resize"
            style={{ 
              width: '100px',
              height: '100px',
              zIndex: 10001,
              pointerEvents: 'auto',
              touchAction: 'none',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.cursor = 'se-resize';
              document.body.style.cursor = 'se-resize';
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                document.body.style.cursor = '';
              }
            }}
            onMouseDown={(e) => {
              e.nativeEvent.stopImmediatePropagation();
              e.stopPropagation();
              e.preventDefault();
              document.body.style.cursor = 'se-resize';
              handleResizeStart(e);
            }}
            onClick={(e) => {
              e.nativeEvent.stopImmediatePropagation();
              e.stopPropagation();
              e.preventDefault();
            }}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            draggable={false}
          >
            <div 
              className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ width: '24px', height: '24px' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 6 6" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="text-primary drop-shadow-md"
              >
                <path d="M6 1L1 6" />
                <path d="M6 3.5L3.5 6" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Drag overlay - entire panel except resize corner */}
        {isEditMode && !isResizing && (
          <div
            {...dragHandleProps}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ 
              top: 0,
              left: 0,
              right: '100px',
              bottom: '100px',
              zIndex: 1,
              pointerEvents: 'auto'
            }}
          />
        )}
        
        {/* Edit mode overlay */}
        {isEditMode && (
          <div 
            className="absolute top-2 right-2 panel-menu opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ zIndex: 10000 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1 shadow-xl animate-fade-in">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                title="Maximize panel"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                title="Edit panel"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                title="Duplicate panel"
              >
                <Copy size={14} />
              </button>
              
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  title="Move panel"
                >
                  <Move size={14} />
                </button>
                {showMoveMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl p-2 z-20 animate-scale-in backdrop-blur-sm">
                    <div className="grid grid-cols-3 gap-1">
                      <div />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("up"); }}
                        className="p-1.5 rounded-md hover:bg-secondary hover:text-primary transition-all duration-200 hover:scale-110"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <div />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("left"); }}
                        className="p-1.5 rounded-md hover:bg-secondary hover:text-primary transition-all duration-200 hover:scale-110"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="p-1.5" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("right"); }}
                        className="p-1.5 rounded-md hover:bg-secondary hover:text-primary transition-all duration-200 hover:scale-110"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <div />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("down"); }}
                        className="p-1.5 rounded-md hover:bg-secondary hover:text-primary transition-all duration-200 hover:scale-110"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <div />
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive hover:scale-110 transition-all duration-200"
                title="Remove panel"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {!isEditMode && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity panel-menu z-10">
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1.5 bg-card/80 backdrop-blur border border-border rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="absolute top-full right-0 mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg py-1 z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
                  >
                    <Maximize2 size={14} />
                    View
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
                  >
                    <Copy size={14} />
                    Duplicate
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
