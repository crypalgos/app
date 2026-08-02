"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { WalkForwardReport } from "@/types/walkforward";
import { IconGauge, IconAlertTriangle } from "@tabler/icons-react";
import { WalkforwardSectionCard } from "./WalkforwardSectionCard";

function gradeColor(grade: string): string {
  if (grade === "A" || grade === "B") return "text-emerald-500 dark:text-emerald-400";
  if (grade === "C") return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

export function RobustnessPanel({ report }: { report: WalkForwardReport }) {
  const { robustness, overfitting, summary } = report;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <WalkforwardSectionCard title="Robustness" subtitle="Score across all rolling windows" icon={IconGauge}>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tabular-nums", gradeColor(robustness.grade))}>
              {robustness.score.toFixed(0)}
            </span>
            <span className="text-[13px] text-muted-foreground">/100</span>
          </div>
          <span className={cn("text-2xl font-bold", gradeColor(robustness.grade))}>{robustness.grade}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <div
            className={cn("h-full rounded-full", robustness.score >= 80 ? "bg-emerald-500" : robustness.score >= 60 ? "bg-amber-500" : "bg-rose-500")}
            style={{ width: `${Math.max(0, Math.min(100, robustness.score))}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-[13px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Pass Rate</span><span className="font-mono font-semibold">{summary.pass_rate}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Windows</span><span className="font-mono">{summary.passed_windows}/{summary.total_windows}</span></div>
        </div>
      </WalkforwardSectionCard>

      <WalkforwardSectionCard title="Overfitting" subtitle="Training vs. out-of-sample degradation" icon={IconAlertTriangle}>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-lg font-bold",
              overfitting.risk_level === "Low" ? "text-emerald-500 dark:text-emerald-400" : overfitting.risk_level === "Moderate" ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"
            )}
          >
            {overfitting.risk_level} Risk
          </span>
          <span className="text-[13px] font-mono text-muted-foreground">{(overfitting.score * 100).toFixed(1)}% degradation</span>
        </div>
        <p className="text-[13px] text-muted-foreground mt-3">
          Degradation is how much worse validation performance is than training performance —
          higher means the strategy is more tuned to its training window than it generalizes.
        </p>
      </WalkforwardSectionCard>
    </div>
  );
}
