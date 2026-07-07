"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useStrategyWalkforward, useRunArtifact } from "@/api-actions/hooks/strategy-hooks";
import type { WalkForwardArtifact, WalkForwardWindowReport } from "@/types/strategy-actions";
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

export default function WalkforwardDetailPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const runId = params?.walkforwardId as string;

  const { data: run, isLoading: runLoading } = useStrategyWalkforward(strategyId, runId);
  const { data: reportData, isLoading: reportLoading } = useRunArtifact(runId, "report");

  const artifact = reportData as unknown as WalkForwardArtifact | undefined;
  const report = artifact?.report;

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
          <p className="text-sm text-muted-foreground mt-1">The walkforward validation could not complete.</p>
        </Card>
      </div>
    );
  }

  const summary = report?.summary;
  const windows = report?.windows ?? [];
  const overfit = report?.overfitting;
  const robustness = report?.robustness;
  const roboScore = robustness?.score ?? summary?.robustness_score ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{run?.name || "Walkforward Run"}</h1>
            <p className="text-xs text-muted-foreground">{run?.description}</p>
          </div>
        </div>
        {statusBadge(run?.status ?? "")}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Robustness" value={`${roboScore.toFixed(0)}/100`} sub={robustness?.grade ?? "—"} />
        <MetricCard label="Pass Rate" value={`${(summary?.pass_rate ?? 0).toFixed(0)}%`} />
        <MetricCard label="Avg Sharpe" value={(summary?.average_sharpe ?? 0).toFixed(3)} />
        <MetricCard label="Total Windows" value={String(summary?.total_windows ?? 0)} />
        <MetricCard label="Overfitting" value={overfit?.risk_level ?? "—"} sub={`${(overfit?.score ?? 0 * 100).toFixed(1)}% degradation`}
          className={cn(overfit?.risk_level === "Low" ? "text-emerald-400" : overfit?.risk_level === "Moderate" ? "text-amber-400" : "text-red-400")} />
      </div>

      {/* Statistical Validity + Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-border/40">
          <h3 className="text-sm font-bold text-foreground mb-2">Statistical Validity</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><span className="font-mono font-semibold">{summary?.statistical_validity ?? "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Passed Windows</span><span className="font-mono">{summary?.passed_windows ?? 0} / {summary?.total_windows ?? 0}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Worst Window</span><span className="font-mono">{summary?.worst_window_id ?? "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Coverage</span><span className="font-mono">{report?.coverage.coverage_pct ?? 0}%</span></div>
          </div>
        </Card>
        <Card className="p-4 border-border/40">
          <h3 className="text-sm font-bold text-foreground mb-2">Recommendation</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Verdict</span><span className={cn("font-mono font-semibold", summary?.recommendation === "APPROVED" ? "text-emerald-400" : summary?.recommendation === "CAUTION" ? "text-amber-400" : "text-red-400")}>{summary?.recommendation ?? "—"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg Drawdown</span><span className="font-mono text-red-400">{(summary?.average_drawdown ?? 0).toFixed(2)}%</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg Profit Factor</span><span className="font-mono">{summary?.average_profit_factor?.toFixed(2) ?? "—"}</span></div>
          </div>
        </Card>
      </div>

      {/* Window Table */}
      {windows.length > 0 && (
        <Card className="p-5 border-border/40">
          <h2 className="text-sm font-bold text-foreground mb-3">Window Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
                  <th className="py-2 pr-3 font-semibold">#</th>
                  <th className="py-2 pr-3 font-semibold">Train</th>
                  <th className="py-2 pr-3 font-semibold">Validation</th>
                  <th className="py-2 pr-3 font-semibold">Train Sharpe</th>
                  <th className="py-2 pr-3 font-semibold">Val Sharpe</th>
                  <th className="py-2 pr-3 font-semibold">Δ Sharpe</th>
                  <th className="py-2 pr-3 font-semibold">Δ Profit</th>
                  <th className="py-2 font-semibold">Passed</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w: WalkForwardWindowReport) => (
                  <tr key={w.window_id} className="border-b border-border/20 hover:bg-muted/5">
                    <td className="py-2 pr-3 font-mono font-bold">{w.window_id}</td>
                    <td className="py-2 pr-3 text-[10px] text-muted-foreground">{w.train_start} → {w.train_end}</td>
                    <td className="py-2 pr-3 text-[10px] text-muted-foreground">{w.validation_start} → {w.validation_end}</td>
                    <td className="py-2 pr-3 font-mono">{(w.train.metrics.sharpe_ratio ?? 0).toFixed(3)}</td>
                    <td className="py-2 pr-3 font-mono">{(w.validation.metrics.sharpe_ratio ?? 0).toFixed(3)}</td>
                    <td className="py-2 pr-3 font-mono" style={{ color: w.delta.sharpe >= 0 ? "#22C55E" : "#EF4444" }}>{w.delta.sharpe >= 0 ? "+" : ""}{w.delta.sharpe.toFixed(4)}</td>
                    <td className="py-2 pr-3 font-mono" style={{ color: w.delta.net_profit >= 0 ? "#22C55E" : "#EF4444" }}>${w.delta.net_profit.toLocaleString()}</td>
                    <td className="py-2">
                      {w.evaluation.passed
                        ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Pass</Badge>
                        : <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Fail</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Parameter Drift */}
      {windows.length > 0 && (
        <Card className="p-5 border-border/40">
          <h2 className="text-sm font-bold text-foreground mb-3">Parameter Drift</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
                  <th className="py-2 pr-3 font-semibold">Window</th>
                  {windows[0] && Object.keys(windows[0].parameter_set).map((k) => (
                    <th key={k} className="py-2 pr-3 font-semibold">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {windows.map((w: WalkForwardWindowReport) => (
                  <tr key={w.window_id} className="border-b border-border/20 hover:bg-muted/5">
                    <td className="py-2 pr-3 font-mono font-bold">#{w.window_id}</td>
                    {Object.values(w.parameter_set).map((v, i) => (
                      <td key={i} className="py-2 pr-3 font-mono text-muted-foreground">{String(v)}</td>
                    ))}
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
