"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { OptimizationHealth, ParameterSensitivity, StabilityRegion } from "@/types/optimization";
import { IconHeartbeat, IconGauge, IconWaveSine, IconRuler2, IconActivity, IconInfoCircle } from "@tabler/icons-react";
import { OptimizationSectionCard } from "./OptimizationSectionCard";

interface OptimizationHealthTilesProps {
  health: OptimizationHealth;
  sensitivity: ParameterSensitivity;
  stability: StabilityRegion;
  totalRuns: number;
  theoreticalGridSize: number | null;
}

type Tone = "good" | "warn" | "bad" | "neutral";

const TONE_CLASSES: Record<Tone, { box: string; icon: string; value: string }> = {
  good: { box: "bg-emerald-500/10 border-emerald-500/20", icon: "text-emerald-500 dark:text-emerald-400", value: "text-emerald-600 dark:text-emerald-400" },
  warn: { box: "bg-amber-500/10 border-amber-500/20", icon: "text-amber-500 dark:text-amber-400", value: "text-amber-600 dark:text-amber-400" },
  bad: { box: "bg-rose-500/10 border-rose-500/20", icon: "text-rose-500 dark:text-rose-400", value: "text-rose-600 dark:text-rose-400" },
  neutral: { box: "bg-muted/50 border-border/60", icon: "text-muted-foreground", value: "text-foreground" },
};

function HealthTile({
  icon: Icon,
  label,
  value,
  tone,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: Tone;
  detail?: string;
}) {
  const c = TONE_CLASSES[tone];
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/40 bg-muted/[0.03] p-3.5">
      <div className={cn("size-8 rounded-lg border flex items-center justify-center", c.box)}>
        <Icon className={cn("size-4", c.icon)} />
      </div>
      <div className="flex flex-col gap-1">
        <span className={cn("text-[17px] font-bold tabular-nums tracking-tight", c.value)}>{value}</span>
        <span className="text-[12px] font-medium text-muted-foreground/70">{label}</span>
        {detail && <span className="text-[11px] text-muted-foreground/50">{detail}</span>}
      </div>
    </div>
  );
}

const HEALTH_LABELS: Record<OptimizationHealth, { label: string; tone: Tone }> = {
  OPTIMIZATION_HEALTHY: { label: "Healthy", tone: "good" },
  OPTIMIZATION_FLAT: { label: "Flat", tone: "warn" },
  OPTIMIZATION_SUSPICIOUS: { label: "Suspicious", tone: "bad" },
};

export function OptimizationHealthTiles({
  health,
  sensitivity,
  stability,
  totalRuns,
  theoreticalGridSize,
}: OptimizationHealthTilesProps) {
  const healthInfo = HEALTH_LABELS[health] ?? { label: health, tone: "neutral" as Tone };
  const coveragePct = theoreticalGridSize ? Math.min(100, (totalRuns / theoreticalGridSize) * 100) : null;
  const sensitivityTone: Tone = sensitivity.sharpe_std < 0.3 ? "good" : sensitivity.sharpe_std < 0.8 ? "warn" : "bad";
  const sensitivityLabel = sensitivityTone === "good" ? "Low" : sensitivityTone === "warn" ? "Moderate" : "High";
  const isFlat = health === "OPTIMIZATION_FLAT";
  const isSuspicious = sensitivity.trade_count_range === 0;

  return (
    <OptimizationSectionCard
      title="Optimization Health"
      subtitle="How trustworthy this sweep's result is, independent of the headline score"
      icon={IconHeartbeat}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <HealthTile icon={IconHeartbeat} label="Health" value={healthInfo.label} tone={healthInfo.tone} />
        <HealthTile
          icon={IconGauge}
          label="Grid Coverage"
          value={coveragePct != null ? `${coveragePct.toFixed(0)}%` : "—"}
          tone={coveragePct == null ? "neutral" : coveragePct >= 80 ? "good" : coveragePct >= 40 ? "warn" : "bad"}
          detail={theoreticalGridSize ? `${totalRuns} / ${theoreticalGridSize} combos` : undefined}
        />
        <HealthTile
          icon={IconActivity}
          label="Flatness"
          value={isFlat ? "Flat" : "Not Flat"}
          tone={isFlat ? "warn" : "good"}
        />
        <HealthTile
          icon={IconWaveSine}
          label="Sensitivity"
          value={sensitivityLabel}
          tone={sensitivityTone}
          detail={`σ Sharpe ${sensitivity.sharpe_std.toFixed(2)}`}
        />
        <HealthTile
          icon={IconRuler2}
          label="Variance"
          value={isSuspicious ? "Suspicious" : "Good"}
          tone={isSuspicious ? "bad" : "good"}
        />
      </div>
      {!stability.available && (
        <div className="flex items-start gap-1.5 mt-4 pt-3 border-t border-border/30">
          <IconInfoCircle className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-muted-foreground/60">{stability.reason}</p>
        </div>
      )}
    </OptimizationSectionCard>
  );
}
