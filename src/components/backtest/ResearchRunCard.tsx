"use client";

import React, { useState } from "react";
import type { ResearchRun } from "@/types/strategy-actions";
import type { BacktestSummary, OptimizationRunSummary, WalkForwardRunSummary, MonteCarloRunSummary } from "@/types/strategy-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconClock,
  IconX,
  IconDotsVertical,
  IconTrash,
  IconChartBar,
  IconArrowUpRight,
  IconArrowDownRight,
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

export function ResearchRunCard({ run, onDelete, onClick }: ResearchRunCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const status = run.status;
  const s = run.summary_json ?? {};
  const runType = run.run_type;

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  let runtime = "–";
  if (run.started_at && run.completed_at) {
    const seconds = Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000);
    runtime = `${seconds}s`;
  }

  // ─── FAILED ──────────────────────────────────────────────────────────────────
  if (status === "FAILED") {
    return (
      <div className="rounded-2xl bg-card border border-destructive/30 p-5 flex flex-col gap-3 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{run.name || runType}</span>
          {statusBadge(status)}
        </div>
        <p className="text-xs text-destructive/80 bg-destructive/10 rounded-xl p-3 border border-destructive/15 line-clamp-3">
          {runType === "MONTECARLO"
            ? "Monte Carlo simulation failed."
            : "Simulation failed during execution."}
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
    return (
      <div className="rounded-2xl bg-card border border-amber-500/20 p-5 flex flex-col gap-3 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{run.name || runType}</span>
          {statusBadge(status)}
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${run.progress_percent}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{run.progress_percent}% complete</span>
          <span className="text-[10px] text-muted-foreground">Started {fmt(run.started_at)}</span>
        </div>
      </div>
    );
  }

  // ─── COMPLETED — per-type metrics ───────────────────────────────────────────

  const renderMetrics = () => {
    switch (runType) {
      case "BACKTEST": {
        const b = s as BacktestSummary;
        const profitPct = b.total_return_pct ?? 0;
        const isProfit = profitPct >= 0;
        const accent = isProfit ? "#22C55E" : "#EF4444";
        return (
          <>
            <div className="px-5 py-3.5 flex items-center gap-6 border-t border-border/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">Total Return</span>
                <div className="flex items-center gap-1">
                  {isProfit ? <IconArrowUpRight className="size-4" style={{ color: accent }} /> : <IconArrowDownRight className="size-4" style={{ color: accent }} />}
                  <span className="text-3xl font-black tabular-nums tracking-tight" style={{ color: accent }}>{isProfit ? "+" : ""}{profitPct.toFixed(2)}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">Net Profit</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: accent }}>
                  {isProfit ? "+" : "-"}${Math.abs(b.net_profit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="w-px h-10 bg-border/50 ml-auto" />
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[10px] text-muted-foreground/60">{(b.initial_capital ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} capital</span>
                <span className="text-[10px] text-muted-foreground/60">{b.leverage ?? 1}× leverage · {runtime}</span>
              </div>
            </div>
            <div className="px-5 pt-3 pb-4 border-t border-border/40 grid grid-cols-4 gap-x-5 gap-y-3">
              <Metric label="Trades" value={String(b.trade_count ?? 0)} />
              <Metric label="Win Rate" value={`${((b.win_rate ?? 0) * 100).toFixed(1)}%`} />
              <Metric label="Sharpe" value={(b.sharpe_ratio ?? 0).toFixed(2)} />
              <Metric label="Max Drawdown" value={`${(b.max_drawdown_pct ?? 0).toFixed(2)}%`} className="text-red-400" />
            </div>
          </>
        );
      }
      case "OPTIMIZATION": {
        const o = s as OptimizationRunSummary;
        return (
          <div className="px-5 pt-3 pb-4 border-t border-border/40 grid grid-cols-4 gap-x-5 gap-y-3">
            <Metric label="Total Results" value={String(o.total_results ?? 0)} />
            <Metric label="Net Profit" value={`$${(o.net_profit ?? 0).toLocaleString()}`} />
            <Metric label="Sharpe" value={(o.sharpe_ratio ?? 0).toFixed(2)} />
            <Metric label="Max Drawdown" value={`${(o.max_drawdown_pct ?? 0).toFixed(2)}%`} className="text-red-400" />
            <Metric label="Return" value={`${(o.total_return_pct ?? 0).toFixed(2)}%`} />
            <Metric label="Trades" value={String(o.trade_count ?? 0)} />
            <Metric label="Sortino" value={(o.sortino_ratio ?? 0).toFixed(2)} />
            <Metric label="Calmar" value={(o.calmar_ratio ?? 0).toFixed(2)} />
          </div>
        );
      }
      case "WALKFORWARD": {
        const w = s as WalkForwardRunSummary;
        return (
          <div className="px-5 pt-3 pb-4 border-t border-border/40 grid grid-cols-4 gap-x-5 gap-y-3">
            <Metric label="Windows" value={String(w.windows_count ?? 0)} />
            <Metric label="Net Profit" value={`$${(w.net_profit ?? 0).toLocaleString()}`} />
            <Metric label="Sharpe" value={(w.sharpe_ratio ?? 0).toFixed(2)} />
            <Metric label="Max Drawdown" value={`${(w.max_drawdown_pct ?? 0).toFixed(2)}%`} className="text-red-400" />
            <Metric label="Return" value={`${(w.total_return_pct ?? 0).toFixed(2)}%`} />
            <Metric label="Trades" value={String(w.trade_count ?? 0)} />
            <Metric label="Sortino" value={(w.sortino_ratio ?? 0).toFixed(2)} />
            <Metric label="Calmar" value={(w.calmar_ratio ?? 0).toFixed(2)} />
          </div>
        );
      }
      case "MONTECARLO": {
        const m = s as MonteCarloRunSummary;
        return (
          <div className="px-5 pt-3 pb-4 border-t border-border/40 grid grid-cols-3 gap-x-5 gap-y-3">
            <Metric label="Median DD" value={`${(m.median_drawdown ?? 0).toFixed(2)}%`} className="text-red-400" />
            <Metric label="Worst DD" value={`${(m.worst_drawdown ?? 0).toFixed(2)}%`} className="text-red-400" />
            <Metric label="Ruin Prob." value={`${((m.probability_of_ruin ?? 0) * 100).toFixed(2)}%`} className="text-amber-400" />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      <div onClick={onClick} className="group relative rounded-2xl bg-card border border-border transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-foreground tracking-tight truncate">{run.name || runType}</span>
              <Badge className="bg-muted/80 text-muted-foreground border-transparent px-1.5 py-0 text-[9px] uppercase font-mono">
                {runType}
              </Badge>
            </div>
            <span className="text-[9px] text-muted-foreground/50">{fmt(run.started_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statusBadge(status)}
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onClick?.(); }} className="h-7 px-3 text-[11px] font-semibold">
              <IconChartBar className="size-3.5 mr-1.5" /> View
            </Button>
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

        {renderMetrics()}
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
