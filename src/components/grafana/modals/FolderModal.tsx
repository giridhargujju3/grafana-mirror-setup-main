import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardRegistry, DashboardFolder } from "@/contexts/DashboardRegistryContext";
import { toast } from "sonner";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFolder?: DashboardFolder | null;
}

export function FolderModal({ isOpen, onClose, editingFolder }: FolderModalProps) {
  const { folders, createFolder, renameFolder } = useDashboardRegistry();
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (editingFolder) {
      setTitle(editingFolder.title);
      setParentId(editingFolder.parentId);
    } else {
      setTitle("");
      setParentId(null);
    }
  }, [editingFolder, isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Folder name is required");
      return;
    }

    if (editingFolder) {
      renameFolder(editingFolder.id, title.trim());
      toast.success("Folder renamed");
    } else {
      createFolder(title.trim(), parentId);
      toast.success("Folder created");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editingFolder ? "Rename Folder" : "Create New Folder"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
            />
          </div>

          {!editingFolder && (
            <div className="space-y-2">
              <Label>Parent Folder (Optional)</Label>
              <Select value={parentId || "root"} onValueChange={(v) => setParentId(v === "root" ? null : v)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="root">Root (No parent)</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingFolder ? "Rename" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
