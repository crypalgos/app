"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconCheck } from "@tabler/icons-react";

export interface PipelineStage {
  label: string;
  /** Has the strategy completed at least one run of this type — from
   * StrategyLatestResults (latest_backtest_id/latest_optimization_id/
   * latest_walkforward_id/latest_montecarlo_id). This is "has this stage
   * ever run," NOT "this specific run descends from that one" — true
   * per-run lineage doesn't exist yet (parent_run_id has no trigger-endpoint
   * support outside Monte Carlo's source_backtest_id). Don't imply otherwise. */
  completed: boolean;
  /** Highlights this stage as the one the user is currently viewing. */
  current?: boolean;
  href?: string;
}

export function ResearchPipelineNav({ stages }: { stages: PipelineStage[] }) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const content = (
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              stage.current
                ? "bg-primary/10 text-primary border border-primary/30"
                : stage.completed
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-muted/20 text-muted-foreground/50 border border-transparent"
            )}
          >
            {stage.completed ? (
              <IconCheck className="size-3" />
            ) : (
              <span className="size-1.5 rounded-full bg-current opacity-40" />
            )}
            {stage.label}
          </div>
        );

        return (
          <React.Fragment key={stage.label}>
            {i > 0 && <span className="text-muted-foreground/20 text-xs px-0.5">&rarr;</span>}
            {stage.href ? <Link href={stage.href}>{content}</Link> : content}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
