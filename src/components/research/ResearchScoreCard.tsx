"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ResearchSubScore {
  label: string;
  /** 0-100 */
  value: number;
}

export interface ResearchScoreCardProps {
  /** Composite score computed from THIS run's own sub-scores only — not a
   * cross-pipeline aggregate spanning multiple run types (that needs run
   * lineage tracking, which doesn't exist yet). Labeled explicitly so it
   * never implies more than it is. */
  score: number;
  subScores: ResearchSubScore[];
}

function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function barColor(value: number): string {
  if (value >= 80) return "bg-emerald-400";
  if (value >= 60) return "bg-amber-400";
  return "bg-red-400";
}

export function ResearchScoreCard({ score, subScores }: ResearchScoreCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-foreground/80 tracking-wide">
          Research Score <span className="text-muted-foreground/50 font-normal">(this run)</span>
        </h3>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-[26px] font-bold tabular-nums", scoreColor(score))}>
            {score.toFixed(0)}
          </span>
          <span className="text-[13px] text-muted-foreground">/100</span>
          <span className={cn("text-base font-bold ml-1", scoreColor(score))}>{grade(score)}</span>
        </div>
      </div>
      <div className="space-y-3">
        {subScores.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-[12.5px] text-muted-foreground w-28 shrink-0">{s.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className={cn("h-full rounded-full", barColor(s.value))}
                style={{ width: `${Math.max(0, Math.min(100, s.value))}%` }}
              />
            </div>
            <span className="text-[12.5px] font-mono font-semibold text-foreground w-9 text-right shrink-0">
              {s.value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
