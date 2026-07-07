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

interface BacktestCardProps {
  run: ResearchRun;
  onDelete: () => void;
  onClick?: () => void;
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">
        {label}
      </span>
      <span className={cn("text-[13px] font-semibold tabular-nums text-foreground", className)}>
        {value}
      </span>
    </div>
  );
}

export function BacktestCard({ run, onDelete, onClick }: BacktestCardProps) {
  const s: BacktestSummary = (run.summary_json ?? {}) as BacktestSummary;
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

  // ─── NORMAL ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onClick}
        className="group relative rounded-2xl bg-card border border-border transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer flex flex-col overflow-hidden font-sans"
      >
        {/* ── HEADER ── */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-bold text-foreground tracking-tight truncate">
                {run.name || "Backtest Run"}
              </span>
              <Badge className="bg-muted/80 text-muted-foreground border-transparent px-1.5 py-0 text-[9px] uppercase font-mono">
                v{run.strategy_version_id?.slice(0, 6) ?? "–"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {s.symbol && (
                <Badge className="bg-primary/10 text-primary border-primary/20 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide">
                  {s.symbol}
                </Badge>
              )}
              {s.exchange && (
                <Badge className="bg-primary/10 text-primary border-primary/20 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide">
                  {s.exchange}
                </Badge>
              )}
              <span className="text-[9px] text-muted-foreground/50">
                {fmt(s.start_date)} → {fmt(s.end_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status === "COMPLETED" ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <IconCheck className="size-3" /> Done
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 animate-pulse">
                <IconClock className="size-3" /> Running
              </span>
            )}
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              className="h-7 px-3 text-[11px] font-semibold"
            >
              <IconChartBar className="size-3.5 mr-1.5" /> Analyze
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <IconDotsVertical className="size-3.5" />
                </Button>
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

        {/* ── EQUITY CHART ── */}
        <div className="relative h-[100px] w-full border-t border-border/30 bg-muted/5">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`g-${run.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={accent} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
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

        {/* ── HERO NUMBERS ── */}
        <div className="px-5 py-3.5 flex items-center gap-6 border-t border-border/40">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">
              Total Return
            </span>
            <div className="flex items-center gap-1">
              {isProfit
                ? <IconArrowUpRight className="size-4" style={{ color: accent }} />
                : <IconArrowDownRight className="size-4" style={{ color: accent }} />
              }
              <span className="text-3xl font-black tabular-nums tracking-tight" style={{ color: accent }}>
                {isProfit ? "+" : ""}{profitPct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">
              Net Profit
            </span>
            <span className="text-xl font-bold tabular-nums" style={{ color: accent }}>
              {isProfit ? "+" : "-"}${Math.abs(s.net_profit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="w-px h-10 bg-border/50 ml-auto" />

          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] text-muted-foreground/60">
              {(s.initial_capital ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} capital
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {s.leverage ?? 1}× leverage · {runtime}
            </span>
          </div>
        </div>

        {/* ── METRICS GRID ── */}
        <div className="px-5 pt-3 pb-4 border-t border-border/40 grid grid-cols-4 gap-x-5 gap-y-3">
          <Metric label="Trades"        value={String(s.trade_count ?? 0)} />
          <Metric label="Win Rate"      value={`${((s.win_rate ?? 0) * 100).toFixed(1)}%`} />
          <Metric label="Profit Factor" value={(s.profit_factor ?? 0).toFixed(2)} />
          <Metric label="Max Drawdown"  value={`${(s.max_drawdown_pct ?? 0).toFixed(2)}%`} className="text-red-400" />
          <Metric label="Sharpe"        value={(s.sharpe_ratio ?? 0).toFixed(2)} />
          <Metric label="Sortino"       value={(s.sortino_ratio ?? 0).toFixed(2)} />
          <Metric label="Calmar"        value={(s.calmar_ratio ?? 0).toFixed(2)} />
          <Metric label="Expectancy"    value={`$${(s.expectancy ?? 0).toFixed(2)}`} />
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
    </>
  );
}
