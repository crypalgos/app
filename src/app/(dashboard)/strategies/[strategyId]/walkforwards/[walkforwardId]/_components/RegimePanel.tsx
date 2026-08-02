"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Regime, WalkForwardReport } from "@/types/walkforward";
import { IconCloud } from "@tabler/icons-react";
import { WalkforwardSectionCard } from "./WalkforwardSectionCard";

const REGIME_ORDER: Regime[] = ["Strong Bull", "Weak Bull", "Sideways", "High Volatility", "Weak Bear", "Strong Bear"];

export function RegimePanel({ regimeSummary }: { regimeSummary: WalkForwardReport["regime_summary"] }) {
  const buckets = REGIME_ORDER.map((regime) => ({ regime, data: regimeSummary[regime] })).filter((b) => b.data);

  if (buckets.length === 0) {
    return (
      <WalkforwardSectionCard title="Market Regime Breakdown" icon={IconCloud}>
        <p className="text-[13px] text-muted-foreground">No regime data available for this run.</p>
      </WalkforwardSectionCard>
    );
  }

  return (
    <WalkforwardSectionCard
      title="Market Regime Breakdown"
      subtitle="Does this strategy pass in every market condition, or only the one it was tuned on?"
      icon={IconCloud}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {buckets.map(({ regime, data }) => {
          if (!data) return null;
          const passPct = data.pass_rate * 100;
          const lowN = data.window_count <= 2;
          const tone = passPct >= 60 ? "text-emerald-500 dark:text-emerald-400" : passPct > 0 ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400";
          return (
            <div key={regime} className="rounded-lg border border-border/40 bg-muted/[0.03] p-3.5">
              <span className="text-[12px] font-medium text-muted-foreground/70">{regime}</span>
              <div className={cn("text-xl font-bold font-mono tabular-nums mt-1", tone)}>
                {passPct.toFixed(0)}%
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">
                {data.window_count} window{data.window_count !== 1 ? "s" : ""}
                {lowN && <span className="text-amber-500/80 dark:text-amber-400/80"> &middot; low confidence</span>}
              </div>
            </div>
          );
        })}
      </div>
    </WalkforwardSectionCard>
  );
}
