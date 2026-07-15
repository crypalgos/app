"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStrategyWalkforward, useRunArtifact, useWalkforwardDataset } from "@/api-actions/hooks/strategy-hooks";
import type { WalkForwardArtifact } from "@/types/walkforward";
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
import { RobustnessPanel } from "./_components/RobustnessPanel";
import { HealthPanel } from "./_components/HealthPanel";
import { WindowTimelineStrip } from "./_components/WindowTimelineStrip";
import { WindowsExplorerTable } from "./_components/WindowsExplorerTable";
import { RegimePanel } from "./_components/RegimePanel";
import { ParameterDriftChart } from "./_components/ParameterDriftChart";
import { WalkforwardLineChart } from "./_components/WalkforwardLineChart";

export default function WalkforwardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params?.strategyId as string;
  const runId = params?.walkforwardId as string;

  const { data: run, isLoading: runLoading } = useStrategyWalkforward(strategyId, runId);
  const { data: reportData, isLoading: reportLoading } = useRunArtifact(runId, "report");
  const { data: equityRows, isLoading: equityLoading } = useWalkforwardDataset(runId, "equity");
  const { data: rollingRows, isLoading: rollingLoading } = useWalkforwardDataset(runId, "rolling");

  const artifact = reportData as unknown as WalkForwardArtifact | undefined;
  const report = artifact?.report;

  const verdictProps = useMemo(() => {
    if (!report) return null;
    const passed = report.recommendation.evaluation.passed;
    const confidence = report.robustness.score;

    const verdict = passed ? (confidence >= 80 ? "Strong Candidate" : "Research Only") : "Rejected";

    const reasons: VerdictReason[] = report.recommendation.evaluation.reasons.map((r) => ({ label: r }));
    const meanReturnPct = report.aggregate_metrics["mean_total_return_pct"];
    if (artifact?.benchmark_return_pct != null && meanReturnPct != null) {
      const delta = meanReturnPct - artifact.benchmark_return_pct;
      reasons.push({
        label: delta >= 0 ? "Beat buy & hold by" : "Underperformed buy & hold by",
        value: `${Math.abs(delta).toFixed(1)}pp`,
      });
    }

    const nextStep: NextStep = passed
      ? {
          action: "Run Monte Carlo",
          kind: "proceed",
          detail:
            confidence < 80
              ? "Robustness is moderate — Monte Carlo will show how this holds up under sequencing risk."
              : undefined,
        }
      : {
          action: "Do not continue — increase robustness first",
          kind: "stop",
          detail: "Address the specific failing windows (see Windows tab) before validating further.",
        };

    const subScores: ResearchSubScore[] = [
      { label: "Robustness", value: report.robustness.score },
      { label: "Consistency", value: report.summary.pass_rate },
      { label: "Generalization", value: Math.max(0, 100 - report.overfitting.score * 100) },
    ];
    const score = subScores.reduce((sum, s) => sum + s.value, 0) / subScores.length;

    const experiments: SuggestedExperiment[] = [];
    const regimeEntries = Object.entries(report.regime_summary).filter(([, d]) => d) as [string, { pass_rate: number; window_count: number }][];
    if (regimeEntries.length > 0) {
      const worst = [...regimeEntries].sort((a, b) => a[1].pass_rate - b[1].pass_rate)[0];
      if (worst[1].pass_rate < 0.5) {
        const isTrendless = worst[0] === "Sideways" || worst[0] === "High Volatility";
        experiments.push({
          current: "Current strategy",
          suggestion: isTrendless ? "Add a trend-strength or volatility filter" : "Review entry logic for this regime",
          rationale: `${(worst[1].pass_rate * 100).toFixed(0)}% pass rate in ${worst[0]} windows (n=${worst[1].window_count}) — the lowest of any regime this strategy has been tested against.`,
        });
      }
    }
    if (report.overfitting.risk_level === "High") {
      experiments.push({
        current: "Current parameter selection process",
        suggestion: "Shrink the parameter search space or lengthen the training window",
        rationale: `Overfitting degradation is ${(report.overfitting.score * 100).toFixed(0)}% — training performance isn't holding up out-of-sample.`,
      });
    }

    return { verdict, passed, confidence, reasons, nextStep, score, subScores, experiments };
  }, [report, artifact]);

  const extractMetrics = (rep: unknown): ComparisonMetric[] => {
    const artifactArg = rep as WalkForwardArtifact;
    const r = artifactArg?.report;
    return [
      { label: "Robustness Score", current: r?.robustness.score ?? null, other: null },
      { label: "Pass Rate", current: r?.summary.pass_rate ?? null, other: null },
      { label: "Avg Sharpe", current: r?.summary.average_sharpe ?? null, other: null },
      { label: "Overfitting Score", current: r ? Math.round(r.overfitting.score * 100) : null, other: null, higherIsBetter: false },
      { label: "Total Windows", current: r?.summary.total_windows ?? null, other: null },
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
          <p className="text-sm text-muted-foreground mt-1">The walkforward validation could not complete.</p>
        </Card>
      </div>
    );
  }

  const windows = report?.windows ?? [];
  const equitySeries = [
    { key: "equity", label: "Out-of-Sample Equity", color: "var(--primary)", points: ((equityRows as { equity: number }[] | undefined) ?? []).map((r, i) => ({ step: i, value: r.equity })) },
  ];
  const rollingSharpeSeries = [
    { key: "sharpe_ratio", label: "Sharpe", color: "#60a5fa", points: ((rollingRows as { window_id: number; sharpe_ratio: number }[] | undefined) ?? []).map((r) => ({ step: r.window_id, value: r.sharpe_ratio })) },
  ];
  const rollingProfitSeries = [
    { key: "net_profit", label: "Net Profit", color: "#34d399", points: ((rollingRows as { window_id: number; net_profit: number }[] | undefined) ?? []).map((r) => ({ step: r.window_id, value: r.net_profit })) },
  ];

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{run?.name || "Walkforward Run"}</h1>
            <p className="text-xs text-muted-foreground">{run?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ComparisonDialog
            strategyId={strategyId}
            currentRunId={runId}
            currentRunName={run?.name ?? "This run"}
            runType="walkforwards"
            listRuns={(sid) => StrategyActions.listWalkForwardRuns(sid, 1, 50)}
            extractMetrics={extractMetrics}
          />
          {statusBadge(run?.status ?? "")}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equity">Equity</TabsTrigger>
          <TabsTrigger value="windows">Windows</TabsTrigger>
          <TabsTrigger value="regime">Regime</TabsTrigger>
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

          {report && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard title="Robustness" value={`${report.robustness.score.toFixed(0)}/100`} subValue={report.robustness.grade} />
              <MetricCard title="Pass Rate" value={`${report.summary.pass_rate.toFixed(0)}%`} />
              <MetricCard title="Avg Sharpe" value={report.summary.average_sharpe.toFixed(3)} />
              <MetricCard title="Total Windows" value={String(report.summary.total_windows)} />
            </div>
          )}

          {verdictProps && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResearchScoreCard score={verdictProps.score} subScores={verdictProps.subScores} />
              <SuggestedExperiments experiments={verdictProps.experiments} />
            </div>
          )}

          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RobustnessPanel report={report} />
              <HealthPanel health={report.health} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="equity" className="space-y-4 mt-4">
          <WalkforwardLineChart title="Out-of-Sample Equity (Stitched)" series={equitySeries} isLoading={equityLoading} valueFormatter={(v) => v.toFixed(0)} height={320} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WalkforwardLineChart title="Rolling Sharpe" series={rollingSharpeSeries} isLoading={rollingLoading} height={220} />
            <WalkforwardLineChart title="Rolling Net Profit" series={rollingProfitSeries} isLoading={rollingLoading} valueFormatter={(v) => `$${v.toFixed(0)}`} height={220} />
          </div>
        </TabsContent>

        <TabsContent value="windows" className="space-y-4 mt-4">
          <WindowTimelineStrip windows={windows} />
          <WindowsExplorerTable windows={windows} runId={runId} />
        </TabsContent>

        <TabsContent value="regime" className="space-y-4 mt-4">
          {report && <RegimePanel regimeSummary={report.regime_summary} />}
          <ParameterDriftChart windows={windows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
