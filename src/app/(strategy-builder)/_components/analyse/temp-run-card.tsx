"use client";

import { useState } from "react";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconCheck,
  IconClock,
  IconX,
  IconStar,
  IconStarFilled,
  IconDeviceFloppy,
  IconArrowUpRight,
  IconArrowDownRight,
  IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
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

interface TempRunCardProps {
  run: ResearchRun;
  onClick: () => void;
  onSave: () => void;
  onTogglePin: () => void;
  isSaving?: boolean;
}

export function TempRunCard({ run, onClick, onSave, onTogglePin, isSaving }: TempRunCardProps) {
  const s: Partial<BacktestSummary> = (run.summary_json ?? {}) as BacktestSummary;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const status = run.status;
  const isRunning = status === "PENDING" || status === "RUNNING" || status === "RETRYING";
  const isFailed = status === "FAILED" || status === "CANCELLED";
  const profitPct = s.total_return_pct ?? 0;
  const isProfit = profitPct >= 0;
  const accent = isProfit ? "var(--color-emerald-500, #10b981)" : "var(--color-rose-500, #f43f5e)";

  return (
    <div
      onClick={!isRunning ? onClick : undefined}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-all",
        !isRunning && "cursor-pointer hover:border-primary/40 hover:bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-bold text-foreground truncate">
            {run.name || "Analyse Run"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(run.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          title={run.is_favorite ? "Unpin (eligible for cleanup)" : "Pin (exempt from retention cleanup)"}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
        >
          {run.is_favorite ? (
            <IconStarFilled className="size-3.5 text-amber-500" />
          ) : (
            <IconStar className="size-3.5" />
          )}
        </button>
      </div>

      {isRunning ? (
        <div className="flex items-center gap-2 py-2">
          <IconClock className="size-3.5 text-amber-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">
            Running… {run.progress_percent}%
          </span>
        </div>
      ) : isFailed ? (
        <div className="flex items-center gap-2 py-2">
          <IconX className="size-3.5 text-rose-500" />
          <span className="text-xs text-rose-500 font-medium">Run failed</span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {isProfit ? (
              <IconArrowUpRight className="size-3.5" style={{ color: accent }} />
            ) : (
              <IconArrowDownRight className="size-3.5" style={{ color: accent }} />
            )}
            <span className="text-base font-black tabular-nums" style={{ color: accent }}>
              {isProfit ? "+" : ""}
              {profitPct.toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {s.trade_count ?? 0} trades
          </span>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {s.win_rate != null ? `${(s.win_rate * 100).toFixed(0)}% win` : ""}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1.5 py-0 gap-1",
            status === "COMPLETED" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
            isFailed && "border-rose-500/30 text-rose-500",
            isRunning && "border-amber-500/30 text-amber-500"
          )}
        >
          {status === "COMPLETED" && <IconCheck className="size-2.5" />}
          {status}
        </Badge>
        {status === "COMPLETED" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="h-6 ml-auto text-[10px] gap-1 cursor-pointer"
          >
            {isSaving ? (
              <IconLoader2 className="size-3 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-3" />
            )}
            Save
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Save this run?</AlertDialogTitle>
            <AlertDialogDescription>
              This promotes the run into a permanent, saved backtest. If your strategy
              has changed since this ran, a new version will be created — otherwise
              it&apos;s linked to your current version with no changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onSave();
                setConfirmOpen(false);
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
