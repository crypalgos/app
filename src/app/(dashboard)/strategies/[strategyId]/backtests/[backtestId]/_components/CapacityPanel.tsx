"use client";

import React from "react";
import { MetricRow, SectionCard } from "./MetricCard";
import { IconStack2 } from "@tabler/icons-react";
import type { CapacityMetrics, GlobalMetrics, DistributionMetric } from "@/types/strategy-actions";

interface CapacityPanelProps {
  capMetrics: CapacityMetrics;
  globalMetrics: GlobalMetrics;
  distMetrics: DistributionMetric;
  totalTrades: number;
}

export function CapacityPanel({
  capMetrics,
  globalMetrics,
  distMetrics,
  totalTrades,
}: CapacityPanelProps) {
  return (
    <SectionCard
      title="Sizing & Capacity"
      icon={<IconStack2 className="size-3.5 text-muted-foreground" />}
    >
      <div className="flex flex-col divide-y divide-border/40">
        <MetricRow
          label="Avg Position"
          value={`$${(capMetrics.average_position_size ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MetricRow
          label="Max Position"
          value={`$${(capMetrics.maximum_position_size ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MetricRow
          label="Avg Margin"
          value={`${((capMetrics.average_margin_usage ?? 0) * 100).toFixed(1)}%`}
        />
        <MetricRow
          label="Max Margin"
          value={`${((capMetrics.maximum_margin_usage ?? 0) * 100).toFixed(1)}%`}
        />
        <MetricRow
          label="Total Trades"
          value={globalMetrics.total_trades ?? totalTrades}
        />
        <MetricRow
          label="Max Consec. Wins"
          value={distMetrics.max_consecutive_wins ?? 0}
        />
      </div>
    </SectionCard>
  );
}
