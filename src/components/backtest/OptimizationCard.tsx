"use client";

import React, { useState } from "react";
import type { ResearchRun } from "@/types/strategy-actions";
import type { OptimizationRunSummary } from "@/types/optimization";
import { Button } from "@/components/ui/button";
import {
  IconCheck,
  IconClock,
  IconX,
  IconDotsVertical,
  IconTrash,
  IconArrowUpRight,
  IconArrowDownRight,
  IconTrophy,
  IconTarget,
  IconArrowRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
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
import { formatMetricLabel, formatParamKey } from "./metric-format";

interface OptimizationCardProps {
  run: ResearchRun;
  versionNumber?: number;
  onDelete: () => void;
  onClick?: () => void;
}

function Metric({ label, value, sublabel, className }: { label: string; value: string; sublabel?: string; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-medium text-muted-foreground/70 whitespace-nowrap">
        {label}
      </span>
      <span className={cn("text-[14px] font-semibold tabular-nums text-foreground", className)}>
        {value}
      </span>
      {sublabel && <span className="text-[9px] text-muted-foreground/50">{sublabel}</span>}
    </div>
  );
}

function robustnessTextClass(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 70) return "text-emerald-500 dark:text-emerald-400";
  if (pct >= 40) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

function robustnessLabel(pct: number | null): string {
  if (pct == null) return "Unavailable";
  if (pct >= 80) return "Very Stable";
  if (pct >= 60) return "Stable";
  if (pct >= 40) return "Moderate";
  return "Unstable";
}

export function OptimizationCard({ run, versionNumber, onDelete, onClick }: OptimizationCardProps) {
  const s: OptimizationRunSummary = (run.summary_json ?? {}) as OptimizationRunSummary;
  const status = run.status;
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const profitPct = s.total_return_pct ?? 0;
  const isProfit = profitPct >= 0;
  const GREEN = "#22C55E";
  const RED = "#EF4444";
  const accent = isProfit ? GREEN : RED;

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  let runtime = "–";
  if (run.started_at && run.completed_at) {
    const seconds = Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000);
    runtime = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  const objectiveLabel = formatMetricLabel(s.objective);
  const bestValueFormatted = (() => {
    if (s.objective_value == null) return "—";
    if (s.objective === "win_rate" || s.objective === "max_drawdown") return `${s.objective_value.toFixed(2)}%`;
    if (s.objective === "net_profit" || s.objective === "expectancy" || s.objective === "average_trade") {
      return `$${s.objective_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return s.objective_value.toFixed(2);
  })();

  const bestParamEntries = Object.entries(s.best_parameters ?? {});
  const visibleParams = bestParamEntries.slice(0, 3);
  const extraParamCount = bestParamEntries.length - visibleParams.length;

  const robustnessPct = s.robustness_pct != null ? Math.round(s.robustness_pct * 100) : null;
  const searchTypeLabel = s.search_type === "random" ? "Random" : "Grid";

  // ─── FAILED ──────────────────────────────────────────────────────────────────
  if (status === "FAILED") {
    return (
      <div className="rounded-2xl bg-card border border-destructive/30 p-5 flex flex-col gap-3 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{run.name || "Optimization"}</span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <IconX className="size-3" /> Failed
          </span>
        </div>
        <p className="text-xs text-destructive/80 bg-destructive/10 rounded-xl p-3 border border-destructive/15 line-clamp-3">
          Optimization run failed during execution.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onDelete}
            className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
            Delete Run
          </Button>
        </div>
      </div>
    );
  }

  // ─── RUNNING / PENDING ───────────────────────────────────────────────────────
  if (status === "RUNNING" || status === "PENDING") {
    return (
      <>
        <div className="rounded-2xl bg-card border border-amber-500/20 p-5 flex flex-col gap-3 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">{run.name || "Optimization Run"}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 animate-pulse">
                <IconClock className="size-3" /> {status === "RUNNING" ? "Running" : "Pending"}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteAlert(true)}
                className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${run.progress_percent ?? 0}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{run.progress_percent ?? 0}% complete</span>
            <span className="text-[10px] text-muted-foreground">Started {fmt(run.started_at)}</span>
          </div>
        </div>

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this optimization run?</AlertDialogTitle>
              <AlertDialogDescription>
                This run is still {status === "RUNNING" ? "running" : "pending"}. Deleting it removes the tracking
                record and any partial results — it doesn&apos;t stop a task that&apos;s already executing on the worker.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ─── NORMAL ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "group relative rounded-[20px] bg-card dark:bg-[#0a0a0a] backdrop-blur-xl border transition-all duration-500 ease-out hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden font-sans min-h-[260px]",
          "border-black/5 dark:border-[#1e1e1e]",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-none",
          "hover:border-violet-500/30 hover:shadow-[0_12px_40px_-15px_rgba(139,92,246,0.2)] dark:hover:shadow-[0_12px_40px_-15px_rgba(139,92,246,0.15)]"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 relative z-10">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] font-extrabold text-foreground tracking-tight truncate">
                {run.name || "Optimization Run"}
              </span>
              <div className="h-3 w-px bg-border/60 mx-1" />
              <span className="text-muted-foreground/60 text-[9.5px] uppercase font-mono font-bold tracking-widest">
                {versionNumber != null ? `v${versionNumber}` : "v–"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 border border-border/60 rounded-md px-1.5 py-0.5 bg-muted/20 shadow-sm">
                <span className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 whitespace-nowrap">
                  {searchTypeLabel} Search
                </span>
              </div>
              <div className="flex items-center gap-1 border border-border/60 rounded-md px-2 py-0.5 bg-muted/20 shadow-sm">
                <IconTarget className="size-2.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                  {objectiveLabel}
                </span>
              </div>
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono tracking-tight font-medium whitespace-nowrap">
                {fmt(run.started_at)}
              </span>
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono font-medium whitespace-nowrap">
                <span className="text-foreground/70 font-bold">{s.total_results ?? 0}</span> evals
              </span>
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono font-medium whitespace-nowrap">
                <span className="text-foreground/70 font-bold">{runtime}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center shrink-0 -mt-1 -mr-2">
            {status === "COMPLETED" ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mr-2">
                <IconCheck className="size-3" /> Done
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 dark:text-amber-400 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mr-2">
                <IconClock className="size-3" /> Running
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                  <IconDotsVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setShowDeleteAlert(true); }}
                  className="text-xs cursor-pointer text-destructive focus:text-destructive"
                >
                  <IconTrash className="size-3.5 mr-2" /> Delete Run
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── HERO NUMBERS ── */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-6 flex-wrap relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Best {objectiveLabel}
            </span>
            <div className="flex items-center gap-1">
              <IconTrophy className="size-4 text-violet-500 dark:text-violet-400" />
              <span className="text-2xl lg:text-3xl font-black tabular-nums tracking-tight text-violet-600 dark:text-violet-400">
                {bestValueFormatted}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Total Return
            </span>
            <div className="flex items-center gap-1">
              {isProfit
                ? <IconArrowUpRight className="size-4" style={{ color: accent }} />
                : <IconArrowDownRight className="size-4" style={{ color: accent }} />
              }
              <span className="text-lg lg:text-xl font-extrabold tabular-nums tracking-tight" style={{ color: accent }}>
                {isProfit ? "+" : ""}{profitPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Net Profit
            </span>
            <span className="text-lg lg:text-xl font-extrabold tabular-nums tracking-tight" style={{ color: accent }}>
              {isProfit ? "+" : "-"}${Math.abs(s.net_profit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* ── METRICS GRID ── */}
        <div className="px-5 pt-3 pb-2 grid grid-cols-3 gap-x-5 gap-y-4 relative z-10">
          <Metric label="Trades" value={String(s.trade_count ?? 0)} />
          <Metric label="Win Rate" value={s.win_rate != null ? `${s.win_rate.toFixed(1)}%` : "—"} />
          <Metric label="Profit Factor" value={(s.profit_factor ?? 0).toFixed(2)} />
          <Metric label="Max Drawdown" value={`${(s.max_drawdown_pct ?? 0).toFixed(2)}%`} className="text-rose-500 dark:text-rose-400" />
          <Metric label="Sharpe" value={(s.sharpe_ratio ?? 0).toFixed(2)} />
          <Metric label="Sortino" value={(s.sortino_ratio ?? 0).toFixed(2)} />
          <Metric label="Calmar" value={(s.calmar_ratio ?? 0).toFixed(2)} />
          <Metric label="Expectancy" value={s.expectancy != null ? `$${s.expectancy.toFixed(2)}` : "—"} />
          <Metric
            label="Robustness"
            value={robustnessPct != null ? `${robustnessPct}%` : "—"}
            sublabel={robustnessLabel(robustnessPct)}
            className={robustnessTextClass(robustnessPct)}
          />
        </div>

        {/* ── BEST PARAMETERS ── */}
        <div className="px-5 pt-3 pb-4 flex flex-col gap-1.5 relative z-10 mt-auto">
          <span className="text-[10px] font-medium text-muted-foreground/70">
            Best Parameters
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {visibleParams.length === 0 && <span className="text-[11px] text-muted-foreground/50">—</span>}
            {visibleParams.map(([k, v]) => (
              <div key={k} className="flex items-center gap-1 border border-border/60 rounded-md px-2 py-0.5 bg-muted/20 shadow-sm" title={k}>
                <span className="text-[9.5px] font-mono font-medium text-muted-foreground">{formatParamKey(k)}</span>
                <span className="text-[9.5px] font-mono font-bold text-foreground">
                  {typeof v === "number" ? Number(v.toFixed(4)) : v}
                </span>
              </div>
            ))}
            {extraParamCount > 0 && (
              <span className="text-[9.5px] font-semibold text-muted-foreground/60">+{extraParamCount} more</span>
            )}
          </div>
        </div>

        {/* ── VIEW FULL BUTTON ── */}
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-border/50 text-[12px] font-bold text-violet-500 dark:text-violet-400 hover:bg-violet-500/5 transition-colors cursor-pointer relative z-10"
        >
          View Full Optimization <IconArrowRight className="size-3.5" />
        </button>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this optimization run?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes run{" "}
              <span className="font-mono text-foreground font-semibold">#{run.id.slice(0, 6)}</span>{" "}
              and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
