"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { StabilityRegion } from "@/types/optimization";
import { IconShieldCheck, IconInfoCircle } from "@tabler/icons-react";
import { OptimizationSectionCard } from "./OptimizationSectionCard";
import { formatParamKey } from "@/components/backtest/metric-format";

function confidenceTone(confidence: number): { label: string; text: string; bar: string } {
  if (confidence >= 0.5) return { label: "High", text: "text-emerald-500 dark:text-emerald-400", bar: "bg-emerald-500" };
  if (confidence >= 0.2) return { label: "Moderate", text: "text-amber-500 dark:text-amber-400", bar: "bg-amber-500" };
  return { label: "Low", text: "text-rose-500 dark:text-rose-400", bar: "bg-rose-500" };
}

export function StabilityRegionCard({ stability }: { stability: StabilityRegion }) {
  if (!stability.available || !stability.regions) {
    return (
      <OptimizationSectionCard title="Stability Region" icon={IconShieldCheck}>
        <div className="flex items-start gap-1.5">
          <IconInfoCircle className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
          <p className="text-[13px] text-muted-foreground">{stability.reason ?? "Not available for this run."}</p>
        </div>
      </OptimizationSectionCard>
    );
  }

  const overall = confidenceTone(stability.confidence ?? 0);

  return (
    <OptimizationSectionCard
      title="Stability Region"
      subtitle="Is the winning combination a broad plateau, or a lucky single-point spike?"
      icon={IconShieldCheck}
      badge={
        <div className="text-right">
          <span className={cn("text-base font-bold", overall.text)}>{overall.label}</span>
          <span className="text-[12px] text-muted-foreground/70 ml-1.5">
            {((stability.confidence ?? 0) * 100).toFixed(0)}% confidence
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(stability.regions).map(([param, region]) => {
          const tone = confidenceTone(region.confidence);
          const isPoint = region.low === region.high;
          // Position the winner + region within the tested [low, high] span for a quick visual read.
          const span = region.high - region.low || 1;
          const winnerPct = isPoint ? 50 : ((region.winning_value - region.low) / span) * 100;
          return (
            <div key={param} className="rounded-lg border border-border/40 bg-muted/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[13px] font-semibold text-foreground/80 truncate" title={param}>{formatParamKey(param)}</span>
                <span className={cn("text-[12px] font-semibold shrink-0", tone.text)}>
                  {tone.label} &middot; {(region.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-lg font-bold font-mono tabular-nums text-foreground">
                  {isPoint ? region.low : `${region.low}–${region.high}`}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  winner <span className="font-mono text-foreground/80">{region.winning_value}</span>
                </span>
              </div>
              {!isPoint && (
                <div className="relative h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div className={cn("absolute inset-y-0 left-0 right-0 opacity-25", tone.bar)} />
                  <div
                    className={cn("absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full ring-2 ring-card", tone.bar)}
                    style={{ left: `${Math.min(100, Math.max(0, winnerPct))}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-muted-foreground/50 mt-4 pt-3 border-t border-border/30">
        Range = contiguous tested values around the winner (dot) that stay within 10% of the best score.
        A wide range means a broad, robust plateau; a narrow one means a lucky single-point spike.
      </p>
    </OptimizationSectionCard>
  );
}
