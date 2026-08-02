"use client";

import React, { useState } from "react";
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
import { IconGitCommit } from "@tabler/icons-react";

interface CreateVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (commitMessage: string) => Promise<void>;
  isSaving: boolean;
}

export function CreateVersionDialog({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
}: CreateVersionDialogProps) {
  const [commitMessage, setCommitMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(commitMessage);
    setCommitMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <IconGitCommit className="size-5" />
              <DialogTitle>Create Manual Snapshot</DialogTitle>
            </div>
            <DialogDescription>
              Save a explicit version snapshot of your current visual canvas and compiled Python code.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="commitMessage" className="text-xs font-medium text-muted-foreground">
                Commit Message / Summary
              </Label>
              <Input
                id="commitMessage"
                placeholder="e.g., Added RSI momentum threshold & 2.5% stop loss"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="h-10 text-sm font-sans"
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
              {isSaving ? "Saving Snapshot..." : "Save Version Snapshot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
