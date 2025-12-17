import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDashboardRegistry, DashboardEntry } from "@/contexts/DashboardRegistryContext";
import { Folder } from "lucide-react";
import { toast } from "sonner";

interface MoveDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: DashboardEntry | null;
}

export function MoveDashboardModal({ isOpen, onClose, dashboard }: MoveDashboardModalProps) {
  const { folders, moveDashboard } = useDashboardRegistry();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(dashboard?.folderId || null);

  const handleMove = () => {
    if (!dashboard) return;
    
    moveDashboard(dashboard.id, selectedFolderId);
    const folderName = selectedFolderId 
      ? folders.find(f => f.id === selectedFolderId)?.title 
      : "General";
    toast.success(`Moved "${dashboard.title}" to ${folderName}`);
    onClose();
  };

  if (!dashboard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Move Dashboard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Move "{dashboard.title}" to a different folder
          </p>

          <div className="space-y-2">
            <Label>Destination Folder</Label>
            <Select 
              value={selectedFolderId || "general"} 
              onValueChange={(v) => setSelectedFolderId(v === "general" ? null : v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <Folder size={14} />
                    <span>General</span>
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder size={14} />
                      <span>{folder.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
