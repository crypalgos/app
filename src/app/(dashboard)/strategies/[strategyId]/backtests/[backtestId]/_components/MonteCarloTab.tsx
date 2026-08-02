"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import { IconArrowUpRight, IconFlask, IconDice5 } from "@tabler/icons-react";
import { MonteCarloTriggerDialog } from "@/components/research/run-trigger-dialogs";
import {
  useMonteCarlosForBacktest,
  useRunArtifact,
  useMonteCarloDataset,
} from "@/api-actions/hooks/strategy-hooks";
import type { MonteCarloArtifact } from "@/types/strategy-actions";
import type { SamplePathRow, PercentileBandRow, RealEquityRow } from "@/types/montecarlo";
import { statusBadge, ReportSectionLabel } from "@/components/shared/report-primitives";
import {
  MonteCarloKpiStrip,
  ReturnDrawdownPanels,
} from "@/app/(dashboard)/strategies/[strategyId]/montecarlos/[montecarloId]/_components/montecarlo-report-sections";
import { SpaghettiFanChart, type SimulationHoverStats } from "@/app/(dashboard)/strategies/[strategyId]/montecarlos/[montecarloId]/_components/SpaghettiFanChart";

export function MonteCarloTab({ strategyId, backtestId }: { strategyId: string; backtestId: string }) {
  const { data, isLoading } = useMonteCarlosForBacktest(strategyId, backtestId);
  const runs = useMemo(() => data?.runs ?? [], [data]);

  // Undefined until the user picks one — falls back to the most recent run below.
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? runs[0] ?? null;

  const { data: reportData, isLoading: reportLoading } = useRunArtifact(selectedRun?.id ?? null, "report");
  const artifact = reportData as unknown as MonteCarloArtifact | undefined;
  const report = artifact?.report;

  const { data: samplePathsRaw, isLoading: samplePathsLoading } = useMonteCarloDataset(selectedRun?.id ?? null, "sample_paths");
  const { data: percentileBandsRaw, isLoading: percentileBandsLoading } = useMonteCarloDataset(selectedRun?.id ?? null, "percentile_bands");
  const { data: realEquityRaw, isLoading: realEquityLoading } = useMonteCarloDataset(selectedRun?.id ?? null, "real_equity");

  const samplePaths = (samplePathsRaw ?? []) as SamplePathRow[];
  const realEquity = (realEquityRaw ?? []) as RealEquityRow[];
  const equityMedianRows = useMemo(
    () =>
      ((percentileBandsRaw ?? []) as PercentileBandRow[])
        .filter((r) => r.metric === "equity")
        .map((r) => ({ step: r.step, p50: r.p50 })),
    [percentileBandsRaw]
  );
  const simulationStatsById = useMemo(() => new Map<number, SimulationHoverStats>(), []);

  const equityLoading = samplePathsLoading || percentileBandsLoading || realEquityLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <Empty className="border border-dashed border-border/40 min-h-[280px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconDice5 />
          </EmptyMedia>
          <EmptyTitle className="text-[15px]">No Monte Carlo Runs Yet</EmptyTitle>
          <EmptyDescription className="text-[13px]">
            Simulate thousands of randomized trade path variations on this backtest to forecast drawdown and ruin risk.
          </EmptyDescription>
        </EmptyHeader>
        <MonteCarloTriggerDialog strategyId={strategyId} lockedBacktestId={backtestId} />
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header: dropdown run selector + trigger + full-report link */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <ReportSectionLabel>Simulation Run</ReportSectionLabel>
          <Select value={selectedRun?.id} onValueChange={setSelectedRunId}>
            <SelectTrigger size="sm" className="h-9 text-[13px] w-auto min-w-[240px]">
              <SelectValue placeholder="Select a run…" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-[13px]">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selectedRun && (
            <Link href={`/strategies/${strategyId}/montecarlos/${selectedRun.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer text-[13px]">
                View Full Report
                <IconArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          )}
          <MonteCarloTriggerDialog
            strategyId={strategyId}
            lockedBacktestId={backtestId}
            trigger={
              <Button size="sm" className="gap-2 font-semibold cursor-pointer text-[13px]">
                <IconFlask className="size-4" />
                New Simulation
              </Button>
            }
          />
        </div>
      </div>

      {selectedRun && (
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          {statusBadge(selectedRun.status)}
          {selectedRun.completed_at && (
            <span>Completed {new Date(selectedRun.completed_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
          )}
        </div>
      )}

      {reportLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
      ) : report ? (
        <>
          <ReportSectionLabel>Overview</ReportSectionLabel>
          <MonteCarloKpiStrip report={report} />
          <ReturnDrawdownPanels report={report} />
          <ReportSectionLabel>Equity</ReportSectionLabel>
          <SpaghettiFanChart
            title="Equity Fan"
            sampleRows={samplePaths}
            field="equity"
            medianRows={equityMedianRows}
            realRows={realEquity}
            simulationStats={simulationStatsById}
            zeroBaseline
            realColor="var(--primary)"
            realLabel="Real Strategy"
            valueFormatter={(v) => `${v >= 0 ? "+" : ""}$${(v / 1000).toFixed(1)}k`}
            isLoading={equityLoading}
          />
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-[13px] text-muted-foreground">
          {selectedRun?.status === "FAILED" ? "This simulation failed to complete." : "Report not available yet."}
        </div>
      )}
    </div>
  );
}
