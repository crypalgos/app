"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useStrategyOptimization, useRunArtifact } from "@/api-actions/hooks/strategy-hooks";
import type { OptimizationArtifact, OptimizationResultEntry } from "@/types/strategy-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconArrowLeft, IconCheck, IconX, IconClock } from "@tabler/icons-react";

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2"><IconCheck className="size-3 mr-1 inline" /> Completed</Badge>;
    case "RUNNING": return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-2 animate-pulse"><IconClock className="size-3 mr-1 inline" /> Running</Badge>;
    case "FAILED": return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-2"><IconX className="size-3 mr-1 inline" /> Failed</Badge>;
    default: return <Badge className="bg-muted/80 text-muted-foreground border-transparent px-2 text-[10px]">{status}</Badge>;
  }
}

function MetricCard({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <Card className="p-3 border-border/40 bg-muted/5 flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums", className ?? "text-foreground")}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </Card>
  );
}

export default function OptimizationDetailPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const runId = params?.optimizationId as string;

  const { data: run, isLoading: runLoading } = useStrategyOptimization(strategyId, runId);
  const { data: artifact, isLoading: reportLoading } = useRunArtifact(runId, "report");

  const a = artifact as unknown as OptimizationArtifact | undefined;

  if (runLoading || reportLoading) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (run?.status === "FAILED") {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6">
        <Card className="border-destructive/30 p-6 text-center">
          <h2 className="text-lg font-bold text-destructive">Run Failed</h2>
          <p className="text-sm text-muted-foreground mt-1">The optimization could not complete. Check the execution logs for details.</p>
        </Card>
      </div>
    );
  }

  const bestResult = a?.best_result;
  const leaderboard = a?.leaderboard ?? [];
  const totalRuns = a?.total_runs ?? leaderboard.length;

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{run?.name || "Optimization Run"}</h1>
            <p className="text-xs text-muted-foreground">{run?.description}</p>
          </div>
        </div>
        {statusBadge(run?.status ?? "")}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Best Score" value={(bestResult?.score ?? 0).toFixed(4)} />
        <MetricCard label="Total Runs" value={String(totalRuns)} />
        <MetricCard label="Sharpe" value={(bestResult?.metrics.sharpe_ratio ?? 0).toFixed(3)} />
        <MetricCard label="Best Rank" value={`#${bestResult?.rank ?? "—"}`} />
      </div>

      {/* Best Parameters */}
      {bestResult && (
        <Card className="p-5 border-border/40">
          <h2 className="text-sm font-bold text-foreground mb-3">Best Parameters</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(bestResult.params ?? {}).map(([key, val]) => (
              <div key={key} className="bg-muted/10 border border-border/30 rounded-lg px-3 py-2">
                <span className="text-[9px] text-muted-foreground block">{key}</span>
                <span className="text-sm font-mono font-semibold">{String(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Best Metrics */}
      {bestResult && (
        <Card className="p-5 border-border/40">
          <h2 className="text-sm font-bold text-foreground mb-3">Best Result Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Net Profit" value={`$${bestResult.metrics.net_profit.toLocaleString()}`} className="text-emerald-400" />
            <MetricCard label="Return" value={`${bestResult.metrics.profit_pct.toFixed(2)}%`} className="text-emerald-400" />
            <MetricCard label="Sharpe" value={bestResult.metrics.sharpe_ratio.toFixed(3)} />
            <MetricCard label="Max Drawdown" value={`${bestResult.metrics.max_drawdown_pct.toFixed(2)}%`} className="text-red-400" />
            <MetricCard label="Win Rate" value={`${(bestResult.metrics.win_rate * 100).toFixed(1)}%`} />
            <MetricCard label="Profit Factor" value={bestResult.metrics.profit_factor.toFixed(2)} />
            <MetricCard label="Total Trades" value={String(bestResult.metrics.total_trades)} />
            <MetricCard label="Expectancy" value={`$${bestResult.metrics.expectancy.toFixed(2)}`} />
            <MetricCard label="Calmar" value={bestResult.metrics.calmar_ratio.toFixed(2)} />
            <MetricCard label="Sortino" value={bestResult.metrics.sortino_ratio.toFixed(2)} />
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="p-5 border-border/40">
          <h2 className="text-sm font-bold text-foreground mb-3">Leaderboard (Top {leaderboard.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
                  <th className="py-2 pr-3 font-semibold">Rank</th>
                  <th className="py-2 pr-3 font-semibold">Score</th>
                  <th className="py-2 pr-3 font-semibold">Sharpe</th>
                  <th className="py-2 pr-3 font-semibold">Net Profit</th>
                  <th className="py-2 pr-3 font-semibold">Max DD</th>
                  <th className="py-2 pr-3 font-semibold">Win Rate</th>
                  <th className="py-2 pr-3 font-semibold">Trades</th>
                  <th className="py-2 font-semibold">Parameters</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r: OptimizationResultEntry) => (
                  <tr key={r.rank} className={cn("border-b border-border/20 hover:bg-muted/5", r.rank === 1 && "bg-emerald-500/5")}>
                    <td className="py-2 pr-3 font-mono font-bold">{r.rank}</td>
                    <td className="py-2 pr-3 font-mono">{r.score.toFixed(4)}</td>
                    <td className="py-2 pr-3 font-mono">{r.metrics.sharpe_ratio.toFixed(2)}</td>
                    <td className="py-2 pr-3 font-mono text-emerald-400">${r.metrics.net_profit.toLocaleString()}</td>
                    <td className="py-2 pr-3 font-mono text-red-400">{r.metrics.max_drawdown_pct.toFixed(1)}%</td>
                    <td className="py-2 pr-3 font-mono">{(r.metrics.win_rate * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-3 font-mono">{r.metrics.total_trades}</td>
                    <td className="py-2 font-mono text-[10px] text-muted-foreground">
                      {Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
