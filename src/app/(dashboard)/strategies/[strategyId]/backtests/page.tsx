"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useStrategyBacktests,
  useDeleteBacktest,
  useVersionNumberMap,
} from "@/api-actions/hooks/strategy-hooks";
import type { ResearchRun } from "@/types/strategy-actions";
import { BacktestCard } from "@/components/backtest/BacktestCard";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  IconChartLine,
} from "@tabler/icons-react";


export default function StrategyBacktestsPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params?.strategyId as string;

  const [page, setPage] = useState(1);
  const limit = 9;

  const { data: apiBacktests, isLoading } = useStrategyBacktests(
    strategyId,
    page,
    limit
  );

  const { mutate: deleteBacktest } = useDeleteBacktest(strategyId);
  const versionNumberMap = useVersionNumberMap(strategyId);

  const handleDeleteBacktest = (backtestId: string) => {
    deleteBacktest(backtestId, {
      onSuccess: () => {
        toast.success("Backtest run deleted successfully.");
      },
      onError: () => toast.error("Failed to delete backtest run."),
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[250px] rounded-[18px]" />
        ))}
      </div>
    );
  }

  const runs = apiBacktests?.runs ?? [];

  if (runs.length === 0 && page === 1) {
    return (
      <Empty className="border border-dashed border-border/40 min-h-[300px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconChartLine />
          </EmptyMedia>
          <EmptyTitle>No Backtest Runs</EmptyTitle>
          <EmptyDescription>
            You haven't run any backtest simulations on this strategy yet. Open the visual builder to run your first simulation.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }


  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <span>Backtest Execution History</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {apiBacktests?.total ?? 0} total runs
          </Badge>
        </h2>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {runs.map((run: ResearchRun) => (
          <BacktestCard
            key={run.id}
            run={run}
            versionNumber={run.strategy_version_id ? versionNumberMap.get(run.strategy_version_id) : undefined}
            onDelete={() => handleDeleteBacktest(run.id)}
            onClick={() => router.push(`/strategies/${strategyId}/backtests/${run.id}`)}
          />
        ))}
      </div>

      {/* Pagination */}
      {apiBacktests && apiBacktests.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            Page {apiBacktests.current_page} of {apiBacktests.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(apiBacktests.total_pages, p + 1))}
            disabled={page === apiBacktests.total_pages}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}

    </div>
  );
}
