"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Regime, WalkForwardReport } from "@/types/walkforward";

const REGIME_ORDER: Regime[] = ["Strong Bull", "Weak Bull", "Sideways", "High Volatility", "Weak Bear", "Strong Bear"];

export function RegimePanel({ regimeSummary }: { regimeSummary: WalkForwardReport["regime_summary"] }) {
  const buckets = REGIME_ORDER.map((regime) => ({ regime, data: regimeSummary[regime] })).filter((b) => b.data);

  if (buckets.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Market Regime Breakdown</h3>
        <p className="text-xs text-muted-foreground">No regime data available for this run.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Market Regime Breakdown</h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        Does this strategy pass in every market condition, or only the one it happened to be tuned on?
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {buckets.map(({ regime, data }) => {
          if (!data) return null;
          const passPct = data.pass_rate * 100;
          const lowN = data.window_count <= 2;
          return (
            <div key={regime} className="rounded-lg border border-border/40 bg-muted/5 p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{regime}</span>
              <div
                className={cn(
                  "text-lg font-bold font-mono tabular-nums mt-1",
                  passPct >= 60 ? "text-emerald-400" : passPct > 0 ? "text-amber-400" : "text-red-400"
                )}
              >
                {passPct.toFixed(0)}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {data.window_count} window{data.window_count !== 1 ? "s" : ""}
                {lowN && <span className="text-amber-400/80"> &middot; low confidence</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
