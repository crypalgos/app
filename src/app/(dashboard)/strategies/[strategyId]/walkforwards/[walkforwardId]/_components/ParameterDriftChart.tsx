"use client";

import React, { useMemo } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { WalkForwardWindowReport } from "@/types/walkforward";
import { IconChartLine } from "@tabler/icons-react";
import { formatParamKey } from "@/components/backtest/metric-format";
import { WalkforwardSectionCard } from "./WalkforwardSectionCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa"];

export function ParameterDriftChart({ windows }: { windows: WalkForwardWindowReport[] }) {
  const paramNames = useMemo(() => {
    if (windows.length === 0) return [];
    return Object.keys(windows[0].parameter_set);
  }, [windows]);

  if (paramNames.length === 0) return null;

  const data = windows.map((w) => {
    const row: Record<string, number> = { window_id: w.window_id };
    for (const p of paramNames) {
      const v = w.parameter_set[p];
      if (typeof v === "number") row[p] = v;
    }
    return row;
  });

  // No `color` field here -- ChartContainer would inject it as a CSS custom
  // property named after the raw key, and raw parameter keys contain dots
  // (e.g. "indicator.ind-ema.ema-fast.period"), which aren't valid inside a
  // dashed-ident. Only `label` (used for the tooltip) is safe as plain text.
  const chartConfig: ChartConfig = {};
  paramNames.forEach((p) => {
    chartConfig[p] = { label: formatParamKey(p) };
  });

  return (
    <WalkforwardSectionCard
      title="Parameter Drift"
      subtitle="Stable line = the optimizer keeps landing on similar values. Jagged = it's chasing a different fit every window."
      icon={IconChartLine}
    >
      <ChartContainer config={chartConfig} className="h-[220px] w-full aspect-auto">
        <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
          <XAxis dataKey="window_id" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} label={{ value: "Window", position: "insideBottom", offset: -4, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={40} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => `Window ${l}`} />} />
          {/* Literal colors, not CSS var(--color-{key}) -- raw compiler
              parameter keys contain dots (e.g. "indicator.ind-ema.ema-fast.
              period"), which aren't valid inside a var() custom-ident and
              would silently fail to resolve. */}
          {paramNames.map((p, i) => (
            <Line key={p} type="stepAfter" dataKey={p} name={formatParamKey(p)} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          ))}
        </ComposedChart>
      </ChartContainer>
    </WalkforwardSectionCard>
  );
}
