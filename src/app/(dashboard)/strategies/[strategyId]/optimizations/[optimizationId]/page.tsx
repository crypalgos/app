"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStrategyOptimization, useRunArtifact } from "@/api-actions/hooks/strategy-hooks";
import type { OptimizationArtifact, OptimizationHealth } from "@/types/optimization";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconArrowLeft } from "@tabler/icons-react";
import { statusBadge } from "@/components/shared/report-primitives";
import { MetricCard } from "@/components/shared/metric-card";
import { ResearchVerdictBanner, type VerdictReason, type NextStep } from "@/components/research/ResearchVerdictBanner";
import { ResearchScoreCard, type ResearchSubScore } from "@/components/research/ResearchScoreCard";
import { SuggestedExperiments, type SuggestedExperiment } from "@/components/research/SuggestedExperiments";
import { ComparisonDialog, type ComparisonMetric } from "@/components/research/ComparisonDialog";
import { StrategyActions } from "@/api-actions/strategy-actions";
import { LeaderboardExplorerTable } from "./_components/LeaderboardExplorerTable";
import { ParameterHeatmap } from "./_components/ParameterHeatmap";
import { StabilityRegionCard } from "./_components/StabilityRegionCard";
import { SensitivityScatter } from "./_components/SensitivityScatter";
import { OptimizationHealthTiles } from "./_components/OptimizationHealthTiles";
import { ConfigurationPanel } from "./_components/ConfigurationPanel";

const HEALTH_LABELS: Record<OptimizationHealth, string> = {
  OPTIMIZATION_HEALTHY: "Healthy",
  OPTIMIZATION_FLAT: "Flat",
  OPTIMIZATION_SUSPICIOUS: "Suspicious",
};

export default function OptimizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params?.strategyId as string;
  const runId = params?.optimizationId as string;

  const { data: run, isLoading: runLoading } = useStrategyOptimization(strategyId, runId);
  const { data: reportData, isLoading: reportLoading } = useRunArtifact(runId, "report");
  const { data: metadataData } = useRunArtifact(runId, "metadata");

  const a = reportData as unknown as OptimizationArtifact | undefined;
  const metadata = metadataData as
    | {
        strategy_id: string;
        run_id: string;
        start_date: string;
        end_date: string;
        initial_capital: number;
        parameter_space: { name: string; type: string; min_val?: number; max_val?: number; step?: number; choices?: unknown[] }[];
        constraints: { metric: string; operator: string; value: number }[];
        search_type: string;
        objective: string;
        max_runs: number;
      }
    | undefined;

  const verdictProps = useMemo(() => {
    if (!a) return null;
    const stability = a.stability_region;
    const health = a.optimization_health;
    const sensitivity = a.parameter_sensitivity;
    const bestResultProfitPct = a.best_result?.metrics.profit_pct ?? null;

    let confidence: number;
    if (stability.available && stability.confidence != null) {
      confidence = stability.confidence * 100;
    } else if (health === "OPTIMIZATION_HEALTHY") {
      confidence = 55;
    } else {
      confidence = 25;
    }
    if (health === "OPTIMIZATION_SUSPICIOUS") confidence = Math.min(confidence, 25);
    if (health === "OPTIMIZATION_FLAT") confidence = Math.min(confidence, 35);

    let verdict: string;
    let passed: boolean;
    if (health === "OPTIMIZATION_SUSPICIOUS") {
      verdict = "Suspicious Result";
      passed = false;
    } else if (health === "OPTIMIZATION_FLAT") {
      verdict = "Flat Optimization";
      passed = false;
    } else if (confidence >= 70) {
      verdict = "Strong Candidate";
      passed = true;
    } else if (confidence >= 50) {
      verdict = "Moderate Candidate";
      passed = true;
    } else {
      verdict = "Weak Candidate";
      passed = false;
    }

    const reasons: VerdictReason[] = [];
    if (stability.available && stability.confidence != null) {
      reasons.push({ label: "Stability region confidence", value: `${(stability.confidence * 100).toFixed(0)}%` });
    } else if (!stability.available) {
      reasons.push({ label: stability.reason ?? "Stability region unavailable" });
    }
    reasons.push({ label: "Optimization health", value: HEALTH_LABELS[health] ?? health });
    reasons.push({ label: "Sharpe std across trials", value: sensitivity.sharpe_std.toFixed(3) });
    reasons.push({ label: "Total runs evaluated", value: String(a.total_runs) });
    if (a.benchmark_return_pct != null && bestResultProfitPct != null) {
      const delta = bestResultProfitPct - a.benchmark_return_pct;
      reasons.push({
        label: delta >= 0 ? "Beat buy & hold by" : "Underperformed buy & hold by",
        value: `${Math.abs(delta).toFixed(1)}pp`,
      });
    }

    const nextStep: NextStep = passed
      ? {
          action: "Run Walk Forward",
          kind: "proceed",
          detail:
            confidence < 70
              ? "Confidence is moderate — walk-forward will show whether this holds out-of-sample."
              : undefined,
        }
      : {
          action: "Increase parameter stability before validation",
          kind: "stop",
          detail:
            health === "OPTIMIZATION_FLAT"
              ? "Parameter sweep shows no meaningful differentiation — widen the swept range or reconsider the strategy logic."
              : "Winning parameters sit in a narrow region, not a broad plateau — small parameter drift could flip this to a loss.",
        };

    const subScores: ResearchSubScore[] = [
      { label: "Stability", value: stability.available ? (stability.confidence ?? 0) * 100 : 30 },
      { label: "Sensitivity", value: sensitivity.sharpe_std < 0.3 ? 90 : sensitivity.sharpe_std < 0.8 ? 60 : 30 },
      { label: "Health", value: health === "OPTIMIZATION_HEALTHY" ? 90 : health === "OPTIMIZATION_FLAT" ? 40 : 20 },
    ];
    const score = subScores.reduce((sum, s) => sum + s.value, 0) / subScores.length;

    const experiments: SuggestedExperiment[] = [];
    if (!stability.available || (stability.confidence ?? 0) < 0.2) {
      experiments.push({
        current: "Current parameter space",
        suggestion: "Widen the swept range",
        rationale:
          "The winning combination sits in a narrow region relative to the tested range — a wider sweep may reveal whether a genuinely stable plateau exists nearby.",
      });
    }
    if (sensitivity.trade_count_range === 0) {
      experiments.push({
        current: "All tested combinations",
        suggestion: "Check the strategy logic",
        rationale:
          "Trade count didn't vary at all across parameter combinations — this often means the swept parameter isn't actually reachable by the entry/exit conditions.",
      });
    }

    return { verdict, passed, confidence, reasons, nextStep, score, subScores, experiments };
  }, [a]);

  const theoreticalGridSize = useMemo(() => {
    if (!metadata || metadata.search_type !== "grid") return null;
    return metadata.parameter_space.reduce((acc, p) => {
      if (p.type === "categorical") return acc * (p.choices?.length ?? 1);
      if (p.min_val != null && p.max_val != null && p.step) {
        return acc * (Math.floor((p.max_val - p.min_val) / p.step) + 1);
      }
      return acc;
    }, 1);
  }, [metadata]);

  const extractMetrics = (rep: unknown): ComparisonMetric[] => {
    const artifact = rep as OptimizationArtifact;
    const best = artifact?.best_result;
    return [
      { label: "Sharpe Ratio", current: best?.metrics.sharpe_ratio ?? null, other: null },
      { label: "Net Profit", current: best?.metrics.net_profit ?? null, other: null },
      { label: "Max Drawdown", current: best?.metrics.max_drawdown_pct ?? null, other: null, higherIsBetter: false },
      { label: "Win Rate", current: best?.metrics.win_rate ?? null, other: null },
      { label: "Total Trades", current: best?.metrics.total_trades ?? null, other: null },
      { label: "Stability Confidence", current: artifact?.stability_region.confidence != null ? Math.round(artifact.stability_region.confidence * 100) : null, other: null },
    ];
  };

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
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{run?.name || "Optimization Run"}</h1>
            <p className="text-xs text-muted-foreground">{run?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ComparisonDialog
            strategyId={strategyId}
            currentRunId={runId}
            currentRunName={run?.name ?? "This run"}
            runType="optimizations"
            listRuns={(sid) => StrategyActions.listOptimizationRuns(sid, 1, 50)}
            extractMetrics={extractMetrics}
          />
          {statusBadge(run?.status ?? "")}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="parameters">Parameter Analysis</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {verdictProps && (
            <ResearchVerdictBanner
              verdict={verdictProps.verdict}
              passed={verdictProps.passed}
              confidence={verdictProps.confidence}
              reasons={verdictProps.reasons}
              nextStep={verdictProps.nextStep}
            />
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard title="Net Profit" value={`$${(bestResult?.metrics.net_profit ?? 0).toLocaleString()}`} color="text-emerald-400" />
            <MetricCard title="Sharpe" value={(bestResult?.metrics.sharpe_ratio ?? 0).toFixed(3)} />
            <MetricCard title="Max Drawdown" value={`${(bestResult?.metrics.max_drawdown_pct ?? 0).toFixed(2)}%`} color="text-red-400" />
            <MetricCard title="Total Runs" value={String(totalRuns)} />
          </div>

          {verdictProps && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResearchScoreCard score={verdictProps.score} subScores={verdictProps.subScores} />
              <SuggestedExperiments experiments={verdictProps.experiments} />
            </div>
          )}

          {a && (
            <OptimizationHealthTiles
              health={a.optimization_health}
              sensitivity={a.parameter_sensitivity}
              stability={a.stability_region}
              totalRuns={totalRuns}
              theoreticalGridSize={theoreticalGridSize}
            />
          )}

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
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardExplorerTable rows={leaderboard} />
        </TabsContent>

        <TabsContent value="parameters" className="space-y-6 mt-4">
          {a && <StabilityRegionCard stability={a.stability_region} />}
          {a && metadata && <ParameterHeatmap results={a.all_results} searchType={metadata.search_type as "grid" | "random"} />}
          {a && <SensitivityScatter results={a.all_results} />}
        </TabsContent>

        <TabsContent value="configuration" className="mt-4">
          <ConfigurationPanel metadata={metadata as never} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
