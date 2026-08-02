"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconTag } from "@tabler/icons-react";

interface LabelEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionNumber: number;
  initialLabel: string;
  onSave: (label: string) => Promise<void>;
  isSaving: boolean;
}

export function LabelEditModal({
  open,
  onOpenChange,
  versionNumber,
  initialLabel,
  onSave,
  isSaving,
}: LabelEditModalProps) {
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(label);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <IconTag className="size-5" />
              <DialogTitle>Edit Label — Version {versionNumber}</DialogTitle>
            </div>
            <DialogDescription>
              Assign a custom tag or release label to identify this snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="versionLabel" className="text-xs font-medium text-muted-foreground">
                Version Tag / Label
              </Label>
              <Input
                id="versionLabel"
                placeholder="e.g., v1.0-prod, Baseline Alpha"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-10 text-sm font-mono"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-9 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? "Saving..." : "Save Label"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
