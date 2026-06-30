"use client";

import React from "react";
import { MetricRow, SectionCard, formatCurrencyValue } from "./MetricCard";
import { IconShield } from "@tabler/icons-react";
import type { RiskMetrics, DistributionMetric } from "@/types/strategy-actions";

interface RiskProfilePanelProps {
  riskMetrics: RiskMetrics;
  distMetrics: DistributionMetric;
}

export function RiskProfilePanel({ riskMetrics, distMetrics }: RiskProfilePanelProps) {
  return (
    <SectionCard
      title="Risk & Distribution"
      icon={<IconShield className="size-3.5 text-muted-foreground" />}
    >
      <div className="flex flex-col divide-y divide-border/40">
        <MetricRow label="VaR 95%" value={`${(riskMetrics.historical_var_95 ?? 0).toFixed(2)}%`} />
        <MetricRow label="CVaR 95%" value={`${(riskMetrics.cvar_95 ?? 0).toFixed(2)}%`} />
        <MetricRow label="Ulcer Index" value={(riskMetrics.ulcer_index ?? 0).toFixed(3)} />
        <MetricRow label="Omega Ratio" value={(riskMetrics.omega_ratio ?? 0).toFixed(3)} />
        <MetricRow label="Expectancy" value={formatCurrencyValue(distMetrics.expectancy ?? 0)} />
        <MetricRow label="Payoff Ratio" value={`${(distMetrics.payoff_ratio ?? 0).toFixed(2)}x`} />
        <MetricRow label="Avg Winner" value={formatCurrencyValue(distMetrics.average_winner ?? 0)} />
        <MetricRow label="Avg Loser" value={formatCurrencyValue(distMetrics.average_loser ?? 0)} />
      </div>
    </SectionCard>
  );
}
