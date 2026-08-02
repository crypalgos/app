"use client";

import React, { useState, useEffect } from "react";
import type { ResearchRun } from "@/types/strategy-actions";
import type { MonteCarloRunSummary } from "@/types/strategy-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconClock,
  IconX,
  IconDotsVertical,
  IconTrash,
} from "@tabler/icons-react";
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

interface ResearchRunCardProps {
  run: ResearchRun;
  onDelete: () => void;
  onClick?: () => void;
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">{label}</span>
      <span className={cn("text-[13px] font-semibold tabular-nums text-foreground", className)}>{value}</span>
    </div>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2"><IconCheck className="size-3 mr-1 inline" /> Done</Badge>;
    case "RUNNING":
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-2 animate-pulse"><IconClock className="size-3 mr-1 inline" /> Running</Badge>;
    case "PENDING":
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] px-2"><IconClock className="size-3 mr-1 inline" /> Pending</Badge>;
    case "FAILED":
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-2"><IconX className="size-3 mr-1 inline" /> Failed</Badge>;
    default:
      return <Badge className="bg-muted/80 text-muted-foreground border-transparent px-2 text-[10px]">{status}</Badge>;
  }
}

/** Ticks once a second, without ever computing `Date.now()` during render. */
function useNowTick(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Monte Carlo run card. The only run type left on this shared component --
 * Backtest/Optimization/Walkforward moved to their own dedicated cards
 * (BacktestCard, OptimizationCard, WalkforwardCard).
 */
export function ResearchRunCard({ run, onDelete, onClick }: ResearchRunCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const now = useNowTick();

  const status = run.status;
  const runType = run.run_type;
  const m = (run.summary_json ?? {}) as MonteCarloRunSummary;

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  // ─── FAILED ──────────────────────────────────────────────────────────────────
  if (status === "FAILED") {
    return (
      <div className="rounded-2xl bg-card border border-destructive/30 p-5 flex flex-col gap-3 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{run.name || runType}</span>
          {statusBadge(status)}
        </div>
        <p className="text-xs text-destructive/80 bg-destructive/10 rounded-xl p-3 border border-destructive/15 line-clamp-3">
          Monte Carlo simulation failed.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onDelete} className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
            Delete Run
          </Button>
        </div>
      </div>
    );
  }

  // ─── RUNNING / PENDING ──────────────────────────────────────────────────────
  if (status === "RUNNING" || status === "PENDING") {
    const elapsed = run.started_at && now !== null
      ? Math.max(0, Math.round((now - new Date(run.started_at).getTime()) / 1000))
      : null;
    const elapsedLabel = elapsed !== null
      ? elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
      : null;

    return (
      <>
        <div className="rounded-2xl bg-card border border-amber-500/20 p-5 flex flex-col gap-3 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">{run.name || runType}</span>
            <div className="flex items-center gap-2">
              {statusBadge(status)}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteAlert(true)}
                className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${run.progress_percent ?? 0}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{run.progress_percent ?? 0}% complete</span>
            <span className="text-[10px] text-muted-foreground">
              Started {fmt(run.started_at)}{elapsedLabel ? ` · Running for ${elapsedLabel}` : ""}
            </span>
          </div>
        </div>

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this {runType.toLowerCase()} run?</AlertDialogTitle>
              <AlertDialogDescription>
                This run is still {status === "RUNNING" ? "running" : "pending"}. Deleting it removes the tracking
                record and any partial results — it doesn&apos;t stop a task that&apos;s already executing on the worker.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ─── COMPLETED — Monte Carlo metrics ─────────────────────────────────────────
  return (
    <>
      <div onClick={onClick} className={cn(
        "group relative rounded-[20px] bg-card dark:bg-[#0a0a0a] backdrop-blur-xl border transition-all duration-500 ease-out cursor-pointer flex flex-col overflow-hidden font-sans min-h-[200px]",
        "border-black/5 dark:border-[#1e1e1e]",
        "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1",
        "hover:border-violet-500/30 hover:shadow-[0_12px_40px_-15px_rgba(139,92,246,0.2)] dark:hover:shadow-[0_12px_40px_-15px_rgba(139,92,246,0.15)]"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
        {/* Header */}
        <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-3 relative z-10">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] font-extrabold text-foreground tracking-tight truncate">{run.name || runType}</span>
              <div className="h-3 w-px bg-border/60 mx-1" />
              <span className="text-muted-foreground/60 text-[9.5px] uppercase font-mono font-bold tracking-widest">
                {runType}
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground/50">{fmt(run.started_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statusBadge(status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <IconDotsVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteAlert(true); }} className="text-xs cursor-pointer text-destructive focus:text-destructive">
                  <IconTrash className="size-3.5 mr-2" /> Delete Run
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-5 pt-6 pb-4 grid grid-cols-3 gap-x-5 gap-y-4 relative z-10">
          <Metric label="Median DD" value={`${(m.median_drawdown ?? 0).toFixed(2)}%`} className="text-rose-500 dark:text-rose-400" />
          <Metric label="Worst DD" value={`${(m.worst_drawdown ?? 0).toFixed(2)}%`} className="text-rose-500 dark:text-rose-400" />
          <Metric label="Capital Ruin Prob." value={`${((m.capital_ruin_probability ?? 0) * 100).toFixed(2)}%`} className="text-amber-500 dark:text-amber-400" />
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {runType.toLowerCase()} run?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes run <span className="font-mono text-foreground font-semibold">#{run.id.slice(0, 6)}</span> and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
