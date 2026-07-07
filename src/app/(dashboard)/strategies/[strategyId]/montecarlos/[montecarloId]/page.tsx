"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useStrategyMonteCarlo, useRunArtifact, useMonteCarloDataset } from "@/api-actions/hooks/strategy-hooks";
import type { MonteCarloArtifact } from "@/types/strategy-actions";
import type { SamplePathRow, PercentileBandRow, RealEquityRow } from "@/types/montecarlo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconArrowLeft, IconCheck, IconX, IconClock } from "@tabler/icons-react";
import { ReportSectionLabel } from "@/components/shared/report-primitives";
import {
  MonteCarloKpiStrip,
  ReturnDrawdownPanels,
  MonteCarloRiskPanel,
  PercentileDistribution,
  RecommendationCard,
} from "./_components/montecarlo-report-sections";
import { EquityFanChart } from "./_components/EquityFanChart";
import { PercentileFanChart } from "./_components/PercentileFanChart";

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2"><IconCheck className="size-3 mr-1 inline" /> Completed</Badge>;
    case "RUNNING": return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-2 animate-pulse"><IconClock className="size-3 mr-1 inline" /> Running</Badge>;
    case "FAILED": return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-2"><IconX className="size-3 mr-1 inline" /> Failed</Badge>;
    default: return <Badge className="bg-muted/80 text-muted-foreground border-transparent px-2 text-[10px]">{status}</Badge>;
  }
}

function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="p-10 text-center text-sm text-muted-foreground">
      {label} — coming soon.
    </Card>
  );
}

export default function MonteCarloDetailPage() {
  const params = useParams();
  const strategyId = params?.strategyId as string;
  const runId = params?.montecarloId as string;

  const { data: run, isLoading: runLoading } = useStrategyMonteCarlo(strategyId, runId);
  const { data: reportData, isLoading: reportLoading } = useRunArtifact(runId, "report");

  const artifact = reportData as unknown as MonteCarloArtifact | undefined;
  const report = artifact?.report;

  const { data: samplePathsRaw, isLoading: samplePathsLoading } = useMonteCarloDataset(runId, "sample_paths");
  const { data: percentileBandsRaw, isLoading: percentileBandsLoading } = useMonteCarloDataset(runId, "percentile_bands");
  const { data: realEquityRaw, isLoading: realEquityLoading } = useMonteCarloDataset(runId, "real_equity");

  const samplePaths = (samplePathsRaw ?? []) as SamplePathRow[];
  const realEquity = (realEquityRaw ?? []) as RealEquityRow[];

  const equityBands = useMemo(
    () => ((percentileBandsRaw ?? []) as PercentileBandRow[]).filter((r) => r.metric === "equity"),
    [percentileBandsRaw]
  );
  const equityMedianRows = useMemo(() => equityBands.map((r) => ({ step: r.step, p50: r.p50 })), [equityBands]);

  const equityLoading = samplePathsLoading || percentileBandsLoading || realEquityLoading;

  if (runLoading || reportLoading) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (run?.status === "FAILED") {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6">
        <Card className="border-destructive/30 p-6 text-center">
          <h2 className="text-lg font-bold text-destructive">Run Failed</h2>
          <p className="text-sm text-muted-foreground mt-1">The Monte Carlo simulation could not complete.</p>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6">
        <Card className="p-6 text-center text-muted-foreground text-sm">Report not available yet.</Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{run?.name || "Monte Carlo Run"}</h1>
            <p className="text-xs text-muted-foreground font-mono">
              {report.configuration.scenario_type} · {report.summary.simulation_count} simulations
            </p>
          </div>
        </div>
        {statusBadge(run?.status ?? "")}
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-5">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equity">Equity</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="probability">Probability</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-5">
          <ReportSectionLabel>Overview</ReportSectionLabel>
          <MonteCarloKpiStrip report={report} />
          <ReturnDrawdownPanels report={report} />
          <PercentileDistribution report={report} />
          <ReportSectionLabel>Recommendation</ReportSectionLabel>
          <RecommendationCard report={report} />
        </TabsContent>

        <TabsContent value="equity" className="flex flex-col gap-5">
          <ReportSectionLabel>Equity</ReportSectionLabel>
          <EquityFanChart
            sampleRows={samplePaths}
            medianRows={equityMedianRows}
            realEquityRows={realEquity}
            isLoading={equityLoading}
          />
          <PercentileFanChart
            rows={equityBands}
            title="Percentile Fan"
            color="#818cf8"
            zeroBaseline
            valueFormatter={(v) => `${v >= 0 ? "+" : ""}$${(v / 1000).toFixed(1)}k`}
            isLoading={percentileBandsLoading}
          />
        </TabsContent>

        <TabsContent value="drawdown">
          <ComingSoon label="Drawdown tab" />
        </TabsContent>
        <TabsContent value="distributions">
          <ComingSoon label="Distributions tab" />
        </TabsContent>
        <TabsContent value="probability">
          <ReportSectionLabel>Risk</ReportSectionLabel>
          <div className="mt-3">
            <MonteCarloRiskPanel report={report} />
          </div>
        </TabsContent>
        <TabsContent value="simulations">
          <ComingSoon label="Simulation Explorer" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
