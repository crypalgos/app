"use client";

import { useParams, useRouter } from "next/navigation";
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useStrategyBacktest } from "@/api-actions/hooks/strategy-hooks";
import { ReplayViewer } from "../../../../_components/analyse/replay-viewer";
import type { ResearchRun } from "@/types/strategy-actions";

export default function AnalyseRunPage() {
  const { workflowid: strategyId, runId } = useParams<{ workflowid: string; runId: string }>();
  const router = useRouter();

  const { data: runDetail, isLoading, isError } = useStrategyBacktest(strategyId, runId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex items-center justify-center">
        <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !runDetail) {
    return (
      <div className="fixed inset-0 top-[68px] bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Couldn&apos;t find this Analyse run.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/workflow/${strategyId}/analyse`)}
          className="cursor-pointer gap-1.5"
        >
          <IconArrowLeft className="size-3.5" /> Back to Analyse
        </Button>
      </div>
    );
  }

  // ReplayViewer (and its ReplayConsole/ReplayDecisionInspector children) only
  // ever read `run.name` and `run.summary_json` off this prop — the rest of
  // ResearchRun's shape is filled in from RunDetail's equivalent fields so we
  // can reuse the single-run GET-by-id endpoint directly instead of relying
  // on the temporary-runs list being loaded.
  const run: ResearchRun = {
    id: runDetail.id,
    strategy_id: strategyId,
    run_type: (runDetail.type as ResearchRun["run_type"]) ?? "BACKTEST",
    name: runDetail.name,
    description: runDetail.description,
    is_favorite: runDetail.is_favorite,
    status: runDetail.status,
    progress_percent: runDetail.progress_percent,
    summary_json: runDetail.summary,
    completed_at: runDetail.completed_at,
    created_at: runDetail.created_at,
    updated_at: runDetail.updated_at,
  };

  return (
    <ReplayViewer
      runId={runId}
      strategyId={strategyId}
      run={run}
      onBack={() => router.push(`/workflow/${strategyId}/analyse`)}
    />
  );
}
