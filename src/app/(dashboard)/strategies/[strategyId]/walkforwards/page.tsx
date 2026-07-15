"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useStrategyWalkforwards,
  useDeleteWalkforward,
} from "@/api-actions/hooks/strategy-hooks";
import type { ResearchRun } from "@/types/strategy-actions";
import { ResearchRunCard } from "@/components/backtest/ResearchRunCard";

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
import { IconScale } from "@tabler/icons-react";
import { WalkForwardTriggerDialog } from "@/components/research/run-trigger-dialogs";

export default function StrategyWalkforwardsPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params?.strategyId as string;

  const [page, setPage] = useState(1);
  const limit = 9;

  const { data, isLoading } = useStrategyWalkforwards(strategyId, page, limit);
  const { mutate: deleteRun } = useDeleteWalkforward(strategyId);

  const handleDelete = (runId: string) => {
    deleteRun(runId, {
      onSuccess: () => toast.success("Walkforward run deleted."),
      onError: () => toast.error("Failed to delete walkforward run."),
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[250px] rounded-[18px]" />
        ))}
      </div>
    );
  }

  const runs = data?.runs ?? [];

  if (runs.length === 0 && page === 1) {
    return (
      <Empty className="border border-dashed border-border/40 min-h-[300px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconScale />
          </EmptyMedia>
          <EmptyTitle>No Walkforward Runs</EmptyTitle>
          <EmptyDescription>
            Validate strategy performance using rolling walkforward analysis to detect overfitting.
          </EmptyDescription>
        </EmptyHeader>
        <WalkForwardTriggerDialog strategyId={strategyId} />
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <span>Walkforward History</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {data?.total ?? 0} total runs
          </Badge>
        </h2>
        <WalkForwardTriggerDialog strategyId={strategyId} />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {runs.map((run: ResearchRun) => (
          <ResearchRunCard
            key={run.id}
            run={run}
            onDelete={() => handleDelete(run.id)}
            onClick={() => router.push(`/strategies/${strategyId}/walkforwards/${run.id}`)}
          />
        ))}
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="cursor-pointer">Previous</Button>
          <span className="text-xs text-muted-foreground font-medium">Page {data.current_page} of {data.total_pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages} className="cursor-pointer">Next</Button>
        </div>
      )}
    </div>
  );
}
