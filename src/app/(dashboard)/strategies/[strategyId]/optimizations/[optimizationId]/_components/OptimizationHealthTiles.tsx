"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { OptimizationHealth, ParameterSensitivity, StabilityRegion } from "@/types/optimization";

interface OptimizationHealthTilesProps {
  health: OptimizationHealth;
  sensitivity: ParameterSensitivity;
  stability: StabilityRegion;
  totalRuns: number;
  theoreticalGridSize: number | null;
}

function tile(label: string, value: string, className?: string) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/5 p-3">
      <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/60">{label}</span>
      <div className={cn("text-sm font-bold font-mono tabular-nums mt-1", className ?? "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

const HEALTH_LABELS: Record<OptimizationHealth, { label: string; className: string }> = {
  OPTIMIZATION_HEALTHY: { label: "Healthy", className: "text-emerald-400" },
  OPTIMIZATION_FLAT: { label: "Flat", className: "text-amber-400" },
  OPTIMIZATION_SUSPICIOUS: { label: "Suspicious", className: "text-red-400" },
};

export function OptimizationHealthTiles({
  health,
  sensitivity,
  stability,
  totalRuns,
  theoreticalGridSize,
}: OptimizationHealthTilesProps) {
  const healthInfo = HEALTH_LABELS[health] ?? { label: health, className: "text-foreground" };
  const coveragePct = theoreticalGridSize ? Math.min(100, (totalRuns / theoreticalGridSize) * 100) : null;
  const sensitivityLabel =
    sensitivity.sharpe_std < 0.3 ? "Low" : sensitivity.sharpe_std < 0.8 ? "Moderate" : "High";
  const varianceLabel = sensitivity.trade_count_range === 0 ? "Suspicious" : "Good";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-4">Optimization Health</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tile("Health", healthInfo.label, healthInfo.className)}
        {tile("Coverage", coveragePct != null ? `${coveragePct.toFixed(0)}%` : "—")}
        {tile("Flatness", health === "OPTIMIZATION_FLAT" ? "Flat" : "Not flat", health === "OPTIMIZATION_FLAT" ? "text-amber-400" : "text-emerald-400")}
        {tile("Sensitivity", sensitivityLabel, sensitivityLabel === "Low" ? "text-emerald-400" : sensitivityLabel === "Moderate" ? "text-amber-400" : "text-red-400")}
        {tile("Variance", varianceLabel, varianceLabel === "Good" ? "text-emerald-400" : "text-red-400")}
      </div>
      {!stability.available && (
        <p className="text-[10px] text-muted-foreground/60 mt-3">{stability.reason}</p>
      )}
    </div>
  );
}
