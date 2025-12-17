import { useState } from "react";
import { Edit, Copy, Trash2, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Maximize2 } from "lucide-react";
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
    movePanel 
  } = useDashboard();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

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

  return (
    <div 
      className={cn(
        "h-full relative group",
        isEditMode && "ring-2 ring-transparent hover:ring-primary/50 rounded-lg transition-all cursor-pointer"
      )}
      onClick={(e) => {
        if (isEditMode && !(e.target as Element).closest('.panel-menu')) {
          handleEdit();
        }
      }}
    >
      {children}
      
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
                <button
                  onClick={(e) => { e.stopPropagation(); toast.info("Maximizing panel..."); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
                >
                  <Maximize2 size={14} />
                  View
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
  );
}