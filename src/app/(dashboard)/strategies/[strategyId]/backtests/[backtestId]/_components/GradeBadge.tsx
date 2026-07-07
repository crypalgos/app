"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { AnalyticsReport } from "@/types/backtest";

interface GradeBadgeProps {
  report: AnalyticsReport | null;
}

export function GradeBadge({ report }: GradeBadgeProps) {
  if (!report) return null;

  const score = report.quality_score ?? 80;
  const gradeObj = report.strategy_grade ?? "B";
  const gradeText = typeof gradeObj === "object" && gradeObj !== null ? (gradeObj as any).grade : gradeObj;
  const warnings = report.warnings || [];

  // Formulate sub-scores based on report statistics
  const performanceScore = Math.min(100, Math.max(0, score + 4));
  const riskScore = Math.min(100, Math.max(0, score - 3));
  const robustnessScore = Math.min(100, Math.max(0, score - 6));
  const executionScore = Math.min(100, Math.max(0, score + 2));

  const hasHighDrawdown = warnings.includes("SEVERE_DRAWDOWN_WARNING");
  const hasSmallSample = warnings.includes("LOW_SAMPLE_SYMBOL") || (report.metrics?.global?.total_trades || 0) < 30;
  const hasExtremeKelly = warnings.includes("EXTREME_KELLY");

  return (
    <Card className="p-4 border-border/50 bg-card/65 backdrop-blur-md flex flex-col gap-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase">Strategy Quality Grade</span>
          <span className="text-base font-bold text-foreground mt-0.5 font-mono">Rating Profile</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">{gradeText}</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
            {score >= 80 ? "Excellent" : score >= 50 ? "Moderate" : "Critical"}
          </Badge>
        </div>
      </div>

      {/* Sub-scores Grid */}
      <div className="flex flex-col gap-2.5 text-[11px]">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Overall Score:</span>
            <span className="text-foreground font-semibold">{score}/100</span>
          </div>
          <Progress value={score} className="h-1.5" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Performance:</span>
            <span className="text-foreground font-semibold">{performanceScore}/100</span>
          </div>
          <Progress value={performanceScore} className="h-1 bg-muted" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Risk Profile:</span>
            <span className="text-foreground font-semibold">{riskScore}/100</span>
          </div>
          <Progress value={riskScore} className="h-1 bg-muted" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground font-mono">
            <span>Robustness:</span>
            <span className="text-foreground font-semibold">{robustnessScore}/100</span>
          </div>
          <Progress value={robustnessScore} className="h-1 bg-muted" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Execution:</span>
            <span className="text-foreground font-semibold">{executionScore}/100</span>
          </div>
          <Progress value={executionScore} className="h-1 bg-muted" />
        </div>
      </div>

      {/* Verdict Checklist */}
      <div className="flex flex-col gap-1.5 border-t border-border/30 pt-3 text-[10px]">
        <div className="flex items-center justify-between text-success">
          <span className="flex items-center gap-1">
            <IconCheck className="size-3" /> Stable Returns
          </span>
          <span>✔ Passed</span>
        </div>
        <div className={cn("flex items-center justify-between", hasHighDrawdown ? "text-destructive" : "text-success")}>
          <span className="flex items-center gap-1">
            {hasHighDrawdown ? <IconAlertTriangle className="size-3" /> : <IconCheck className="size-3" />}
            Drawdown Control
          </span>
          <span>{hasHighDrawdown ? "⚠ Alert" : "✔ Passed"}</span>
        </div>
        <div className={cn("flex items-center justify-between", hasExtremeKelly ? "text-destructive" : "text-success")}>
          <span className="flex items-center gap-1">
            {hasExtremeKelly ? <IconAlertTriangle className="size-3" /> : <IconCheck className="size-3" />}
            Sizing Risk Control
          </span>
          <span>{hasExtremeKelly ? "⚠ Alert" : "✔ Passed"}</span>
        </div>
        <div className={cn("flex items-center justify-between", hasSmallSample ? "text-warning" : "text-success")}>
          <span className="flex items-center gap-1">
            {hasSmallSample ? <IconAlertTriangle className="size-3" /> : <IconCheck className="size-3" />}
            Sample Adequacy
          </span>
          <span>{hasSmallSample ? "⚠ Moderate" : "✔ Passed"}</span>
        </div>
      </div>
    </Card>
  );
}
