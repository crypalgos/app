"use client";

import React, { useState } from "react";
import type { ResearchRun, BacktestSummary } from "@/types/strategy-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import {
  IconCheck,
  IconClock,
  IconX,
  IconDotsVertical,
  IconTrash,
  IconPlayerPlay,
  IconChartBar,
  IconGitCompare,
  IconDownload,
  IconArrowUpRight,
  IconArrowDownRight,
  IconStar,
  IconStarFilled,
  IconDeviceFloppy,
  IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getCoinLogoUrl } from "@/lib/instruments";
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

interface BacktestCardProps {
  run: ResearchRun;
  /** Human-readable strategy version number, resolved from run.strategy_version_id. */
  versionNumber?: number;
  onDelete: () => void;
  onClick?: () => void;
  /** Analyse-tab only: promotes a temporary run into a saved, versioned backtest. */
  onSave?: () => void;
  isSaving?: boolean;
  /** Analyse-tab only: pins a temporary run so retention cleanup skips it. */
  onTogglePin?: () => void;
  isFavorite?: boolean;
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-medium text-muted-foreground/70 whitespace-nowrap">
        {label}
      </span>
      <span className={cn("text-[14px] font-semibold tabular-nums text-foreground", className)}>
        {value}
      </span>
    </div>
  );
}

export function BacktestCard({
  run,
  versionNumber,
  onDelete,
  onClick,
  onSave,
  isSaving,
  onTogglePin,
  isFavorite,
}: BacktestCardProps) {
  const s: BacktestSummary = (run.summary_json ?? {}) as BacktestSummary;
  const status = run.status;
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const profitPct = s.total_return_pct ?? 0;
  const isProfit = profitPct >= 0;
  const GREEN = "#22C55E";
  const RED = "#EF4444";
  const accent = isProfit ? GREEN : RED;

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  let runtime = "–";
  if (run.started_at && run.completed_at) {
    const seconds = Math.round(
      (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
    );
    runtime = `${seconds}s`;
  }

  const chartData: { i: number; v: number }[] = Array.isArray(s.equity_preview)
    ? s.equity_preview.map(([, v], i) => ({ i, v }))
    : [];

  // ─── FAILED ──────────────────────────────────────────────────────────────────
  if (s.error || status === "FAILED") {
    return (
      <div className="rounded-2xl bg-card border border-destructive/30 p-5 flex flex-col gap-3 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{run.name || "Backtest"}</span>
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-2">
            <IconX className="size-3 mr-1 inline" /> Failed
          </Badge>
        </div>
        <p className="text-xs text-destructive/80 bg-destructive/10 rounded-xl p-3 border border-destructive/15 line-clamp-3">
          {s.error || "Simulation failed during execution."}
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
            <span className="text-sm font-bold text-foreground">{run.name || "Backtest Run"}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 animate-pulse">
                <IconClock className="size-3" /> {status === "RUNNING" ? "Running" : "Pending"}
              </span>
              {onTogglePin && (
                <button
                  onClick={onTogglePin}
                  title={isFavorite ? "Unpin (eligible for cleanup)" : "Pin (exempt from retention cleanup)"}
                  className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  {isFavorite ? (
                    <IconStarFilled className="size-3.5 text-amber-500" />
                  ) : (
                    <IconStar className="size-3.5" />
                  )}
                </button>
              )}
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
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${run.progress_percent ?? 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{run.progress_percent ?? 0}% complete</span>
            <span className="text-[10px] text-muted-foreground">Started {fmt(run.started_at)}</span>
          </div>
        </div>

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this backtest run?</AlertDialogTitle>
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

  // ─── NORMAL ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "group relative rounded-[20px] bg-card dark:bg-[#0a0a0a] backdrop-blur-xl border transition-all duration-500 ease-out hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden font-sans min-h-[260px]",
          "border-black/5 dark:border-[#1e1e1e]",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-none",
          isProfit 
            ? "hover:border-emerald-500/30 hover:shadow-[0_12px_40px_-15px_rgba(34,197,94,0.2)] dark:hover:shadow-[0_12px_40px_-15px_rgba(34,197,94,0.15)]"
            : "hover:border-rose-500/30 hover:shadow-[0_12px_40px_-15px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_12px_40px_-15px_rgba(244,63,94,0.15)]"
        )}
      >
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none",
          isProfit ? "from-emerald-500/5" : "from-rose-500/5"
        )} />

        {/* ── HEADER ── */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 relative z-10">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] font-extrabold text-foreground tracking-tight truncate">
                {run.name || "Backtest Run"}
              </span>
              <div className="h-3 w-px bg-border/60 mx-1" />
              <span className="text-muted-foreground/60 text-[9.5px] font-mono font-bold">
                {versionNumber != null ? `v${versionNumber}` : "v–"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {s.symbol && (
                <div className="flex items-center gap-1.5 border border-border/60 rounded-md px-1.5 py-0.5 bg-muted/20 shadow-sm">
                  <img 
                    src={getCoinLogoUrl(s.symbol.replace(/USD[T]?|PERP/i, ''))} 
                    alt={s.symbol}
                    className="w-3.5 h-3.5 rounded-full"
                    onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${s.symbol}&background=random`;
                    }}
                  />
                  <span className="text-[9.5px] font-bold text-foreground font-mono pr-0.5">
                    {s.symbol}
                  </span>
                </div>
              )}
              {s.exchange && (
                <div className="flex items-center gap-1 border border-border/60 rounded-md px-2 py-0.5 bg-muted/20 shadow-sm">
                  <span className="text-[9.5px] font-bold text-muted-foreground font-mono capitalize">
                    {s.exchange}
                  </span>
                </div>
              )}
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono tracking-tight font-medium whitespace-nowrap">
                {fmt(s.start_date)} → {fmt(s.end_date)}
              </span>
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono font-medium whitespace-nowrap">
                <span className="text-foreground/70 font-bold">{(s.initial_capital ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</span> cap
              </span>
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono font-medium whitespace-nowrap">
                <span className="text-foreground/70 font-bold">{s.leverage ?? 1}×</span> lev
              </span>
              <div className="h-3 w-px bg-border/60 mx-0.5" />
              <span className="text-[9.5px] text-muted-foreground font-mono font-medium whitespace-nowrap">
                <span className="text-foreground/70 font-bold">{runtime}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center shrink-0 -mt-1 -mr-2">
            {onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                title={isFavorite ? "Unpin (eligible for cleanup)" : "Pin (exempt from retention cleanup)"}
                className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer mr-1"
              >
                {isFavorite ? (
                  <IconStarFilled className="size-3.5 text-amber-500" />
                ) : (
                  <IconStar className="size-3.5" />
                )}
              </button>
            )}
            {onSave && status === "COMPLETED" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSaveAlert(true);
                }}
                className="h-6 mr-2 text-[10px] gap-1 cursor-pointer"
              >
                {isSaving ? (
                  <IconLoader2 className="size-3 animate-spin" />
                ) : (
                  <IconDeviceFloppy className="size-3" />
                )}
                Save
              </Button>
            ) : status === "COMPLETED" ? (
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
                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-xs cursor-pointer">
                  <IconDownload className="size-3.5 mr-2" /> Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-xs cursor-pointer">
                  <IconGitCompare className="size-3.5 mr-2" /> Compare
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-xs cursor-pointer">
                  <IconPlayerPlay className="size-3.5 mr-2" /> Replay
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setShowDeleteAlert(true); }}
                  className="text-xs cursor-pointer text-destructive focus:text-destructive mt-1 border-t border-border/50 pt-1"
                >
                  <IconTrash className="size-3.5 mr-2" /> Delete Run
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── HERO NUMBERS ── */}
        <div className="px-5 pt-6 pb-2 flex items-center gap-6 flex-wrap relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Total Return
            </span>
            <div className="flex items-center gap-1">
              {isProfit
                ? <IconArrowUpRight className="size-4" style={{ color: accent }} />
                : <IconArrowDownRight className="size-4" style={{ color: accent }} />
              }
              <span className="text-2xl lg:text-3xl font-black tabular-nums tracking-tight" style={{ color: accent }}>
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
        <div className="px-5 pt-3 pb-2 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 relative z-10">
          <Metric label="Trades"        value={String(s.trade_count ?? 0)} />
          <Metric label="Win Rate"      value={`${((s.win_rate ?? 0) * 100).toFixed(1)}%`} />
          <Metric label="Profit Factor" value={(s.profit_factor ?? 0).toFixed(2)} />
          <Metric label="Max Drawdown"  value={`${(s.max_drawdown_pct ?? 0).toFixed(2)}%`} className="text-rose-500 dark:text-rose-400" />
          <Metric label="Sharpe"        value={(s.sharpe_ratio ?? 0).toFixed(2)} />
          <Metric label="Sortino"       value={(s.sortino_ratio ?? 0).toFixed(2)} />
          <Metric label="Calmar"        value={(s.calmar_ratio ?? 0).toFixed(2)} />
          <Metric label="Expectancy"    value={`$${(s.expectancy ?? 0).toFixed(2)}`} />
        </div>

        {/* ── EQUITY CHART ── */}
        <div className="relative h-[80px] w-full mt-auto relative z-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`g-${run.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={accent} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-popover border border-border px-2.5 py-1 rounded-lg text-[11px] font-mono text-popover-foreground shadow-xl">
                        ${Number(payload[0].value).toFixed(2)}
                      </div>
                    ) : null
                  }
                  cursor={{ stroke: accent, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.4 }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill={`url(#g-${run.id})`}
                  isAnimationActive={false}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground/40">
              No equity curve
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this backtest run?</AlertDialogTitle>
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

      {onSave && (
        <AlertDialog open={showSaveAlert} onOpenChange={setShowSaveAlert}>
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
              <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setShowSaveAlert(false); }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                  setShowSaveAlert(false);
                }}
              >
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
