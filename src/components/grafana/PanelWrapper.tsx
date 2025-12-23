import { useState, useRef, useEffect } from "react";
import { Edit, Copy, Trash2, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Maximize2, Minimize2 } from "lucide-react";
import { useDashboard, PanelConfig } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PanelWrapperProps {
  panel: PanelConfig;
  children: React.ReactNode;
}

export function PanelWrapper({ panel, children }: PanelWrapperProps) {
  const { 
    isEditMode, 
    setEditingPanel, 
    setShowPanelEditor, 
    removePanel, 
    duplicatePanel,
    movePanel,
    updatePanel
  } = useDashboard();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef({ 
    startX: 0, 
    startY: 0, 
    startW: 0, 
    startH: 0, 
    initialGridW: 0, 
    initialGridH: 0,
    gridX: 0,
    gridY: 0
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
    // Critical: Stop propagation to prevent parent Draggable from starting a drag
    e.stopPropagation();
    e.preventDefault();
    
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      initialGridW: panel.gridPos.w,
      initialGridH: panel.gridPos.h,
      gridX: panel.gridPos.x,
      gridY: panel.gridPos.y
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    const { startX, startY, startW, initialGridW, initialGridH, gridX, gridY } = resizeRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Calculate new grid width
    // We know current pixel width corresponds to initialGridW
    // So pixels per column = startW / initialGridW
    // Avoid division by zero
    const pixelsPerCol = initialGridW > 0 ? startW / initialGridW : 100;
    const colDelta = Math.round(deltaX / pixelsPerCol);
    const newGridW = Math.max(2, Math.min(12, initialGridW + colDelta)); // Min 2 cols, max 12

    // Calculate new grid height
    // We assumed 1 unit = 72px in GrafanaDashboard.tsx
    const pixelsPerRow = 72;
    const rowDelta = Math.round(deltaY / pixelsPerRow);
    const newGridH = Math.max(2, initialGridH + rowDelta); // Min 2 rows

    // Only update if changed
    if (newGridW !== panel.gridPos.w || newGridH !== panel.gridPos.h) {
       updatePanel(panel.id, { 
         gridPos: { x: gridX, y: gridY, w: newGridW, h: newGridH } 
       });
    }
  };

  const handleResizeEnd = () => {
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  return (
    <>
      {/* Maximized Overlay */}
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
          isEditMode && "ring-2 ring-transparent hover:ring-primary/50 rounded-lg transition-all cursor-pointer"
        )}
        onClick={(e) => {
          if (isEditMode && !(e.target as Element).closest('.panel-menu') && !(e.target as Element).closest('.resize-handle')) {
            handleEdit();
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleMaximize();
        }}
      >
        {children}
        
        {/* Resize Handle */}
        {isEditMode && (
          <div
            className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeStart}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="8" height="8" viewBox="0 0 6 6" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <path d="M6 1L1 6" />
              <path d="M6 3.5L3.5 6" />
            </svg>
          </div>
        )}
        
        {/* Edit mode overlay */}
        {isEditMode && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity panel-menu z-10">
            <div className="flex items-center gap-1 bg-card/95 backdrop-blur border border-border rounded-lg p-1 shadow-lg">
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Edit panel"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Duplicate panel"
              >
                <Copy size={14} />
              </button>
              
              {/* Move menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Move panel"
                >
                  <Move size={14} />
                </button>
                {showMoveMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-2 z-20">
                    <div className="grid grid-cols-3 gap-1">
                      <div />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("up"); }}
                        className="p-1.5 rounded hover:bg-secondary transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <div />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("left"); }}
                        className="p-1.5 rounded hover:bg-secondary transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="p-1.5" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("right"); }}
                        className="p-1.5 rounded hover:bg-secondary transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <div />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMove("down"); }}
                        className="p-1.5 rounded hover:bg-secondary transition-colors"
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
                className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                title="Remove panel"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* View mode - show menu on hover */}
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