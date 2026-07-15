"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { StabilityRegion } from "@/types/optimization";

function confidenceBadge(confidence: number): { label: string; className: string } {
  if (confidence >= 0.5) return { label: "High", className: "text-emerald-400" };
  if (confidence >= 0.2) return { label: "Moderate", className: "text-amber-400" };
  return { label: "Low", className: "text-red-400" };
}

export function StabilityRegionCard({ stability }: { stability: StabilityRegion }) {
  if (!stability.available || !stability.regions) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Stability Region</h3>
        <p className="text-xs text-muted-foreground">
          {stability.reason ?? "Not available for this run."}
        </p>
      </div>
    );
  }

  const overall = confidenceBadge(stability.confidence ?? 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Stability Region</h3>
        <div className="text-right">
          <span className={cn("text-sm font-bold", overall.className)}>{overall.label}</span>
          <span className="text-[10px] text-muted-foreground/70 ml-1.5">
            confidence &middot; {((stability.confidence ?? 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(stability.regions).map(([param, region]) => {
          const badge = confidenceBadge(region.confidence);
          const isPoint = region.low === region.high;
          return (
            <div key={param} className="rounded-lg border border-border/40 bg-muted/5 p-3">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">
                {param}
              </span>
              <div className="text-lg font-bold font-mono tabular-nums mt-1">
                {isPoint ? region.low : `${region.low}–${region.high}`}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                winner: <span className="font-mono">{region.winning_value}</span>
              </div>
              <div className={cn("text-[10px] font-semibold mt-1", badge.className)}>
                {badge.label} confidence ({(region.confidence * 100).toFixed(0)}%)
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-3">
        Range = contiguous tested values around the winner that stay within 10% of the best score.
        A wide range means the result is a broad plateau, not a lucky single-point spike.
      </p>
    </div>
  );
}
