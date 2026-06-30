"use client";

import React from "react";
import { MetricCard } from "./MetricCard";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconCoins,
  IconFileSpreadsheet,
  IconChartBar,
} from "@tabler/icons-react";
import type { GlobalMetrics, DistributionMetric } from "@/types/strategy-actions";

interface MetricsGridProps {
  profitVal: number;
  isProfit: boolean;
  globalMetrics: GlobalMetrics;
  distMetrics: DistributionMetric;
  metricsJson: Record<string, number>;
}

export function MetricsGrid({
  profitVal,
  isProfit,
  globalMetrics,
  distMetrics,
  metricsJson,
}: MetricsGridProps) {
  const accent = isProfit ? "text-success" : "text-destructive";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard
        title="Net Profit"
        value={`$${profitVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        color={accent}
        icon={isProfit ? IconTrendingUp : IconTrendingDown}
      />
      <MetricCard
        title="Return"
        value={`${(globalMetrics.total_return_pct ?? metricsJson?.profit_pct ?? 0).toFixed(2)}%`}
        color={accent}
        icon={IconChartBar}
      />
      <MetricCard
        title="Sharpe"
        value={(globalMetrics.sharpe_ratio ?? metricsJson?.sharpe_ratio ?? 0).toFixed(2)}
        icon={IconActivity}
      />
      <MetricCard
        title="Max Drawdown"
        value={`${(globalMetrics.max_drawdown_pct ?? metricsJson?.max_drawdown ?? 0).toFixed(2)}%`}
        color="text-destructive"
      />
      <MetricCard
        title="Win Rate"
        value={
          globalMetrics.win_rate !== undefined
            ? `${(globalMetrics.win_rate * 100).toFixed(1)}%`
            : `${(metricsJson?.win_rate ?? 0).toFixed(1)}%`
        }
        subValue={
          distMetrics.payoff_ratio !== undefined
            ? `${distMetrics.payoff_ratio.toFixed(2)}x`
            : undefined
        }
        icon={IconCoins}
      />
      <MetricCard
        title="Profit Factor"
        value={globalMetrics.profit_factor ? globalMetrics.profit_factor.toFixed(2) : "—"}
        icon={IconFileSpreadsheet}
      />
    </div>
  );
}
