import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesModalProps {
  open: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
  dashboardTitle: string;
  isNew?: boolean;
}

export function UnsavedChangesModal({
  open,
  onClose,
  onDiscard,
  onSave,
  dashboardTitle,
  isNew,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-grafana-yellow" />
            Unsaved changes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isNew 
              ? `Dashboard "${dashboardTitle}" has not been saved yet.`
              : `Dashboard "${dashboardTitle}" has unsaved changes.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {isNew 
              ? "Do you want to save this new dashboard or discard it?"
              : "Do you want to save your changes before leaving?"
            }
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
          >
            {isNew ? "Discard dashboard" : "Discard changes"}
          </Button>
          <Button
            onClick={onSave}
            className="bg-grafana-blue hover:bg-grafana-blue/90"
          >
            Save dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
