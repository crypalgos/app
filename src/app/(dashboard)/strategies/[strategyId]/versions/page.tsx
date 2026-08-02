"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IconHistory,
  IconSearch,
  IconFilter,
  IconStarFilled,
  IconCheck,
  IconGitBranch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  useStrategy,
  useStrategyVersions,
  useRestoreVersion,
  useSaveVersion,
  useSetGoldenVersion,
  useUpdateVersionLabel,
  useUpdateVersionApproval,
} from "@/api-actions/hooks/strategy-hooks";
import {
  VersionHeader,
  CreateVersionDialog,
  VersionTimelineItem,
} from "./_components";
import { cn } from "@/lib/utils";

export default function StrategyVersionsPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "GOLDEN" | "APPROVED">("ALL");

  const { data: strategy, isLoading: strategyLoading } = useStrategy(strategyId);
  const { data: versions = [], isLoading: versionsLoading } = useStrategyVersions(strategyId);

  const { mutateAsync: saveVersion, isPending: isSaving } = useSaveVersion(strategyId);
  const { mutateAsync: restoreVersion, isPending: isRestoring } = useRestoreVersion(strategyId);
  const { mutateAsync: setGolden, isPending: isGoldenPending } = useSetGoldenVersion();
  const { mutateAsync: updateLabel } = useUpdateVersionLabel(strategyId);
  const { mutateAsync: updateApproval } = useUpdateVersionApproval(strategyId);

  // Filter versions by search term and filter mode
  const filteredVersions = versions.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      (v.commit_message ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.label ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      `v${v.version}`.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === "GOLDEN") return v.is_golden;
    if (filterMode === "APPROVED") return (v.approval_status || "APPROVED").toUpperCase() === "APPROVED";

    return true;
  });

  const handleCreateSnapshot = async (commitMessage: string) => {
    try {
      await saveVersion(commitMessage);
      toast.success("Manual strategy version snapshot saved successfully.");
    } catch {
      toast.error("Failed to save version snapshot.");
    }
  };

  const handleRestore = async (version: number) => {
    try {
      await restoreVersion(version);
      toast.success(`Version ${version} successfully restored into active workspace.`);
    } catch {
      toast.error("Failed to restore strategy version.");
    }
  };

  const handleSetGolden = async (version: number) => {
    try {
      await setGolden({ strategyId, version });
      toast.success(`Version ${version} set as Golden Production Candidate.`);
    } catch {
      toast.error("Failed to set golden version candidate.");
    }
  };

  const handleUpdateLabel = async (version: number, label: string) => {
    try {
      await updateLabel({ version, label });
      toast.success(`Version ${version} label updated to "${label}".`);
    } catch {
      toast.error("Failed to update version label.");
    }
  };

  const handleUpdateApproval = async (version: number, approvalStatus: string) => {
    try {
      await updateApproval({ version, approvalStatus });
      toast.success(`Version ${version} approval status set to ${approvalStatus}.`);
    } catch {
      toast.error("Failed to update version approval status.");
    }
  };

  const isLoading = strategyLoading || versionsLoading;

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col gap-6 animate-in fade-in duration-300 pb-20">
      {/* Overview Header & Metrics */}
      <VersionHeader
        strategy={strategy}
        versions={versions}
        onCreateSnapshot={() => setCreateDialogOpen(true)}
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search commits, labels, version numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-muted/40 border border-border/40 p-1 rounded-lg w-fit">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs px-2.5 rounded-md font-medium",
              filterMode === "ALL" ? "bg-background shadow-2xs text-foreground font-semibold" : "text-muted-foreground"
            )}
            onClick={() => setFilterMode("ALL")}
          >
            All ({versions.length})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs px-2.5 rounded-md font-medium gap-1",
              filterMode === "GOLDEN" ? "bg-background shadow-2xs text-amber-500 font-semibold" : "text-muted-foreground"
            )}
            onClick={() => setFilterMode("GOLDEN")}
          >
            <IconStarFilled className="size-3 text-amber-500" />
            Golden ({versions.filter((v) => v.is_golden).length})
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs px-2.5 rounded-md font-medium gap-1",
              filterMode === "APPROVED" ? "bg-background shadow-2xs text-emerald-500 font-semibold" : "text-muted-foreground"
            )}
            onClick={() => setFilterMode("APPROVED")}
          >
            <IconCheck className="size-3 text-emerald-500" />
            Approved ({versions.filter((v) => (v.approval_status || "APPROVED").toUpperCase() === "APPROVED").length})
          </Button>
        </div>
      </div>

      {/* Version Timeline Content */}
      {isLoading ? (
        <div className="space-y-4 pt-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : filteredVersions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/50 rounded-2xl gap-3 bg-card/20">
          <div className="size-10 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground">
            <IconHistory className="size-5" />
          </div>
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-foreground">No versions found</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {searchQuery || filterMode !== "ALL"
                ? "No strategy version snapshots match your active search filter."
                : "Version snapshots are saved automatically whenever you run backtests or optimizations, or manually via Create Snapshot."}
            </p>
          </div>

          {!searchQuery && filterMode === "ALL" && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 mt-2"
            >
              <IconGitBranch className="size-3.5" />
              Create First Snapshot
            </Button>
          )}
        </div>
      ) : (
        <div className="pt-2">
          {filteredVersions.map((v) => (
            <VersionTimelineItem
              key={v.id}
              version={v}
              isCurrent={v.version === strategy?.current_version}
              strategyId={strategyId}
              currentDraftCode={strategy?.compiled_code}
              onRestore={handleRestore}
              onSetGolden={handleSetGolden}
              onUpdateLabel={handleUpdateLabel}
              onUpdateApproval={handleUpdateApproval}
              isRestoring={isRestoring}
              isGoldenPending={isGoldenPending}
            />
          ))}
        </div>
      )}

      {/* Dialog for creating manual version snapshots */}
      <CreateVersionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSnapshot}
        isSaving={isSaving}
      />
    </div>
  );
}
