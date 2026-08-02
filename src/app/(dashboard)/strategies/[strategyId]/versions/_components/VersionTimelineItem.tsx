"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconGitCommit,
  IconStar,
  IconStarFilled,
  IconGitMerge,
  IconArrowBackUp,
  IconChevronDown,
  IconTag,
  IconCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";
import { VersionDiffViewer } from "./VersionDiffViewer";
import { LabelEditModal } from "./LabelEditModal";
import { cn } from "@/lib/utils";
import { useVersionDiff } from "@/api-actions/hooks/strategy-hooks";
import type { StrategyVersion } from "@/types/strategy-actions";

interface VersionTimelineItemProps {
  version: StrategyVersion;
  isCurrent: boolean;
  strategyId: string;
  currentDraftCode?: string;
  onRestore: (version: number) => Promise<void>;
  onSetGolden: (version: number) => Promise<void>;
  onUpdateLabel: (version: number, label: string) => Promise<void>;
  onUpdateApproval: (version: number, approvalStatus: string) => Promise<void>;
  isRestoring: boolean;
  isGoldenPending: boolean;
}

export function VersionTimelineItem({
  version,
  isCurrent,
  strategyId,
  currentDraftCode,
  onRestore,
  onSetGolden,
  onUpdateLabel,
  onUpdateApproval,
  isRestoring,
  isGoldenPending,
}: VersionTimelineItemProps) {
  const [diffOpen, setDiffOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  const { data: diff, isLoading: diffLoading } = useVersionDiff(
    diffOpen ? strategyId : null,
    diffOpen ? version.version : null
  );

  const approvalStatus = (version.approval_status || "APPROVED").toUpperCase();
  const commitHash = version.compiled_hash ? version.compiled_hash.slice(0, 7) : "df83a21";

  const getApprovalBadge = () => {
    switch (approvalStatus) {
      case "APPROVED":
        return (
          <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium flex items-center gap-1">
            <IconCheck className="size-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-medium flex items-center gap-1">
            <IconX className="size-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium flex items-center gap-1">
            <IconClock className="size-3" />
            Pending Review
          </Badge>
        );
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 pb-6 group last:pb-0 w-full max-w-full min-w-0">
      {/* Vertical Git Timeline Branch Line */}
      <div className="absolute left-2.5 sm:left-3.5 top-5 bottom-0 w-0.5 bg-border/40 group-last:hidden" />

      {/* Node Commit Icon */}
      <div
        className={cn(
          "absolute left-0 sm:left-1 top-3.5 size-5 sm:size-6 rounded-full flex items-center justify-center border transition-all duration-200 z-10",
          version.is_golden
            ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            : isCurrent
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-border text-muted-foreground group-hover:border-primary/60"
        )}
      >
        {version.is_golden ? (
          <IconStarFilled className="size-3" />
        ) : (
          <IconGitCommit className="size-3" />
        )}
      </div>

      {/* Main Version Card Container */}
      <div className="rounded-xl border border-border/50 bg-card/60 hover:bg-card/90 transition-all duration-200 p-4 shadow-2xs w-full max-w-full min-w-0 overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-extrabold font-mono text-foreground">
              v{version.version}
            </span>

            <span className="text-[11px] font-mono text-muted-foreground/70 bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded-md">
              {commitHash}
            </span>

            {isCurrent && (
              <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 font-semibold">
                Active Draft
              </Badge>
            )}

            {version.is_golden && (
              <Badge className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium flex items-center gap-1 shadow-2xs">
                <IconStarFilled className="size-3" />
                Golden Version
              </Badge>
            )}

            {version.label && (
              <Badge variant="outline" className="text-[10.5px] px-2 py-0.5 font-mono text-foreground flex items-center gap-1">
                <IconTag className="size-3 text-muted-foreground" />
                {version.label}
              </Badge>
            )}

            {version.is_code_modified && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-mono text-amber-400">
                Custom Python Code
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Approval Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer outline-none transition-transform active:scale-95">
                  {getApprovalBadge()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuItem onClick={() => onUpdateApproval(version.version, "APPROVED")}>
                  <IconCheck className="size-3.5 mr-2 text-emerald-500" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateApproval(version.version, "PENDING_REVIEW")}>
                  <IconClock className="size-3.5 mr-2 text-muted-foreground" />
                  Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateApproval(version.version, "REJECTED")}>
                  <IconX className="size-3.5 mr-2 text-rose-500" />
                  Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Set Golden Candidate Star Button */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "size-8 rounded-lg border-border/50 transition-colors",
                version.is_golden
                  ? "text-amber-500 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20"
                  : "text-muted-foreground hover:text-amber-500 hover:border-amber-500/30"
              )}
              title={version.is_golden ? "Golden Candidate" : "Set as Golden Version"}
              onClick={() => onSetGolden(version.version)}
              disabled={isGoldenPending}
            >
              {version.is_golden ? (
                <IconStarFilled className="size-4 text-amber-500" />
              ) : (
                <IconStar className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Commit Message & Metadata */}
        <div className="py-3 flex flex-col gap-1.5">
          <p className="text-xs font-medium text-foreground/90 leading-relaxed">
            {version.commit_message || `Version snapshot ${version.version}`}
          </p>
          <span className="text-[11px] text-muted-foreground/70">
            Committed on {new Date(version.created_at).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setLabelModalOpen(true)}
            >
              <IconTag className="size-3.5" />
              <span>{version.label ? "Edit Label" : "Add Label"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setDiffOpen((v) => !v)}
            >
              <IconGitMerge className="size-3.5" />
              <span>Code Diff</span>
              <IconChevronDown
                className={cn("size-3.5 transition-transform duration-200", diffOpen && "rotate-180")}
              />
            </Button>
          </div>

          {!isCurrent && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-border/60 hover:border-border font-semibold text-foreground"
              onClick={() => setConfirmOpen(true)}
              disabled={isRestoring}
            >
              <IconArrowBackUp className="size-3.5 text-primary" />
              <span>Restore Version</span>
            </Button>
          )}
        </div>

        {/* Code Diff Drawer */}
        {diffOpen && (
          <div className="mt-3 pt-3 border-t border-border/40">
            {diffLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <VersionDiffViewer
                diffCode={diff?.diff_code ?? ""}
                originalCode={version.compiled_code}
                modifiedCode={currentDraftCode}
                canvasChanged={diff?.canvas_changed}
              />
            )}
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {version.version}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will overwrite your active draft workspace with Version {version.version}&apos;s visual DAG canvas and compiled Python strategy code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={async () => {
                await onRestore(version.version);
                setConfirmOpen(false);
              }}
            >
              Restore Version {version.version}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Label Edit Modal */}
      <LabelEditModal
        open={labelModalOpen}
        onOpenChange={setLabelModalOpen}
        versionNumber={version.version}
        initialLabel={version.label || ""}
        onSave={(newLabel) => onUpdateLabel(version.version, newLabel)}
        isSaving={false}
      />
    </div>
  );
}
