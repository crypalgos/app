"use client";

import React from "react";
import type { ParameterDefinition, Constraint } from "@/types/optimization";
import {
  IconSettings,
  IconTarget,
  IconDice5,
  IconGridDots,
  IconCoin,
  IconCalendarStats,
  IconAdjustmentsHorizontal,
  IconShieldLock,
} from "@tabler/icons-react";
import { OptimizationSectionCard } from "./OptimizationSectionCard";
import { formatMetricLabel, formatParamKey } from "@/components/backtest/metric-format";

interface OptimizationMetadata {
  strategy_id: string;
  run_id: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  parameter_space: ParameterDefinition[];
  constraints: Constraint[];
  search_type: string;
  objective: string;
  max_runs: number;
}

function ConfigRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-4 text-muted-foreground/60 shrink-0" />
        <span className="text-[13px] text-muted-foreground truncate">{label}</span>
      </div>
      <span className="text-[13px] font-mono font-semibold text-foreground shrink-0">{value}</span>
    </div>
  );
}

export function ConfigurationPanel({ metadata }: { metadata: OptimizationMetadata | undefined }) {
  if (!metadata) return null;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <OptimizationSectionCard title="Run Configuration" icon={IconSettings}>
        <div className="flex flex-col">
          <ConfigRow icon={IconTarget} label="Objective" value={formatMetricLabel(metadata.objective)} />
          <ConfigRow
            icon={metadata.search_type === "random" ? IconDice5 : IconGridDots}
            label="Search Type"
            value={metadata.search_type === "random" ? "Random" : "Grid"}
          />
          <ConfigRow icon={IconAdjustmentsHorizontal} label="Max Runs" value={metadata.max_runs.toLocaleString()} />
          <ConfigRow icon={IconCoin} label="Initial Capital" value={`$${metadata.initial_capital.toLocaleString()}`} />
          <ConfigRow icon={IconCalendarStats} label="Date Range" value={`${fmtDate(metadata.start_date)} → ${fmtDate(metadata.end_date)}`} />
        </div>
      </OptimizationSectionCard>

      <OptimizationSectionCard
        title="Parameter Space"
        subtitle={`${metadata.parameter_space.length} parameter${metadata.parameter_space.length === 1 ? "" : "s"} swept`}
        icon={IconAdjustmentsHorizontal}
      >
        <div className="flex flex-col gap-2">
          {metadata.parameter_space.map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-3 text-[13px] rounded-lg border border-border/40 bg-muted/[0.03] px-3.5 py-2.5">
              <span className="font-medium text-foreground/80 truncate" title={p.name}>{formatParamKey(p.name)}</span>
              <span className="font-mono font-semibold text-foreground shrink-0">
                {p.type === "categorical" ? p.choices?.join(", ") : `${p.min_val} – ${p.max_val} (step ${p.step})`}
              </span>
            </div>
          ))}
        </div>

        {metadata.constraints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-1.5 mb-2">
              <IconShieldLock className="size-3.5 text-muted-foreground/60" />
              <span className="text-[13px] font-semibold text-foreground/70">Constraints</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {metadata.constraints.map((c, i) => (
                <span key={i} className="text-[13px] font-mono text-muted-foreground bg-muted/[0.03] border border-border/30 rounded-md px-2.5 py-1.5 w-fit">
                  {c.metric} {c.operator} {c.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </OptimizationSectionCard>
    </div>
  );
}
