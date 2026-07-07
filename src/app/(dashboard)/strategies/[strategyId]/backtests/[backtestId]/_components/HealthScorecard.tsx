"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { AnalyticsReport } from "@/types/backtest";

interface HealthScorecardProps {
  report: AnalyticsReport | null;
}

export function HealthScorecard({ report }: HealthScorecardProps) {
  if (!report) return null;

  const score = report.research_health?.score ?? report.quality_score ?? 85;
  const status = report.research_health?.status ?? (score >= 80 ? "HEALTHY" : score >= 50 ? "WARNING" : "CRITICAL");
  const warnings = report.warnings || [];

  const totalTrades = report.metrics?.global?.total_trades || 0;
  const hasLowSample = totalTrades < 30;
  const hasHighDrawdown = warnings.includes("SEVERE_DRAWDOWN_WARNING");
  
  const hhi = report.metrics?.concentration?.hhi_index;
  const hasHighConcentration = hhi && hhi > 2500;

  const avgCorr = report.metrics?.diversification?.average_correlation;
  const hasHighCorr = avgCorr && avgCorr > 0.4;

  const kellyVal = report.metrics?.distributions?.global?.kelly_pct;
  const hasExtremeKelly = kellyVal && kellyVal > 75.0;

  return (
    <Card className="p-4 border-border/50 bg-card/65 backdrop-blur-md flex flex-col gap-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase">Research Robustness</span>
          <span className="text-base font-bold text-foreground mt-0.5">Health Audit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-success">{score}</span>
          <Badge
            className={cn(
              "border text-[10px] uppercase font-bold",
              status === "HEALTHY"
                ? "bg-success/10 text-success border-success/20"
                : status === "WARNING"
                ? "bg-warning/10 text-warning border-warning/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {status}
          </Badge>
        </div>
      </div>

      {/* Checklist Explained */}
      <div className="flex flex-col gap-2.5 text-[11px]">
        {/* Trades Count */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {hasLowSample ? (
              <IconAlertTriangle className="size-3.5 text-warning" />
            ) : (
              <IconCheck className="size-3.5 text-success" />
            )}
            Sample Size (Trades)
          </span>
          <span className={cn("font-semibold", hasLowSample ? "text-warning" : "text-success")}>
            {totalTrades} trades {hasLowSample ? "(Moderate)" : "(Valid)"}
          </span>
        </div>

        {/* Stable Equity */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {hasHighDrawdown ? (
              <IconAlertTriangle className="size-3.5 text-destructive" />
            ) : (
              <IconCheck className="size-3.5 text-success" />
            )}
            Stable Equity Curve
          </span>
          <span className={cn("font-semibold", hasHighDrawdown ? "text-destructive" : "text-success")}>
            {hasHighDrawdown ? "Alert (High DD)" : "Stable"}
          </span>
        </div>

        {/* Concentration HHI */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {hasHighConcentration ? (
              <IconAlertTriangle className="size-3.5 text-warning" />
            ) : (
              <IconCheck className="size-3.5 text-success" />
            )}
            Asset Concentration
          </span>
          <span className={cn("font-semibold", hasHighConcentration ? "text-warning" : "text-success")}>
            {hhi ? `HHI ${hhi.toFixed(0)}` : "Low"}
          </span>
        </div>

        {/* Correlation Diversification */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {hasHighCorr ? (
              <IconAlertTriangle className="size-3.5 text-warning" />
            ) : (
              <IconCheck className="size-3.5 text-success" />
            )}
            Portfolio Correlation
          </span>
          <span className={cn("font-semibold", hasHighCorr ? "text-warning" : "text-success")}>
            {avgCorr ? `Avg Corr ${avgCorr.toFixed(2)}` : "Low"}
          </span>
        </div>

        {/* Kelly Leverage Sizing */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {hasExtremeKelly ? (
              <IconAlertTriangle className="size-3.5 text-destructive" />
            ) : (
              <IconCheck className="size-3.5 text-success" />
            )}
            Kelly Allocation Sizing
          </span>
          <span className={cn("font-semibold", hasExtremeKelly ? "text-destructive" : "text-success")}>
            {kellyVal ? `${kellyVal.toFixed(1)}%` : "Safe"}
          </span>
        </div>
      </div>
    </Card>
  );
}
