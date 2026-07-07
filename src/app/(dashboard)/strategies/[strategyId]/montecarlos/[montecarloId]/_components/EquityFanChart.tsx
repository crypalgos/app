"use client";

import React, { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { SamplePathRow, RealEquityRow } from "@/types/montecarlo";

interface EquityFanChartProps {
  /** Long-format rows from sample_paths.arrow (ADR-009) — grouped client-side by simulation_id. */
  sampleRows: SamplePathRow[];
  /** percentile_bands.arrow rows filtered to metric === "equity", for the p50 median line. */
  medianRows: { step: number; p50: number }[];
  /** The actual backtest's real equity curve — the bold "Real Strategy" overlay. */
  realEquityRows: RealEquityRow[];
  isLoading?: boolean;
}

const REAL_COLOR = "var(--primary)"; // bold 3px reference line — the real backtest
const MEDIAN_COLOR = "#818cf8"; // indigo-400
const SAMPLE_PALETTE = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399",
  "#2dd4bf", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6",
];

function FanTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const real = payload.find((p) => p.dataKey === "real");
  const median = payload.find((p) => p.dataKey === "median");
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[170px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">Step {label}</p>
      {real && (
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: REAL_COLOR }} />
          <span className="text-[11px] text-muted-foreground">Real Strategy</span>
          <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">
            {real.value >= 0 ? "+" : ""}${real.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
      {median && (
        <div className="flex items-center gap-2 mt-1">
          <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: MEDIAN_COLOR }} />
          <span className="text-[11px] text-muted-foreground">Median P&amp;L</span>
          <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">
            {median.value >= 0 ? "+" : ""}${median.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
      <p className="text-[9px] text-muted-foreground/60 mt-1.5">
        {payload.length - (real ? 1 : 0) - (median ? 1 : 0)} simulated paths
      </p>
    </div>
  );
}

export function EquityFanChart({ sampleRows, medianRows, realEquityRows, isLoading }: EquityFanChartProps) {
  const bySimulation = useMemo(() => {
    const map = new Map<number, SamplePathRow[]>();
    for (const row of sampleRows) {
      const arr = map.get(row.simulation_id);
      if (arr) arr.push(row);
      else map.set(row.simulation_id, [row]);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.step - b.step);
    return map;
  }, [sampleRows]);

  const simIds = useMemo(() => Array.from(bySimulation.keys()).sort((a, b) => a - b), [bySimulation]);

  const data = useMemo(() => {
    const stepCount = Math.max(
      0,
      ...Array.from(bySimulation.values()).map((arr) => arr.length),
      medianRows.length,
      realEquityRows.length
    );
    if (stepCount === 0) return [];

    // Every path (real, median, simulated) starts at the same initial
    // capital — use that as the zero baseline so the chart reads as
    // cumulative profit/loss, not absolute equity.
    const baseline =
      realEquityRows[0]?.equity ?? medianRows[0]?.p50 ?? bySimulation.get(simIds[0])?.[0]?.equity ?? 0;

    return Array.from({ length: stepCount }, (_, i) => {
      const row: Record<string, number> = { step: i };
      for (const simId of simIds) {
        const v = bySimulation.get(simId)?.[i]?.equity;
        if (v != null) row[`sim_${simId}`] = v - baseline;
      }
      if (medianRows[i]) row.median = medianRows[i].p50 - baseline;
      if (realEquityRows[i]) row.real = realEquityRows[i].equity - baseline;
      return row;
    });
  }, [bySimulation, simIds, medianRows, realEquityRows]);

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: REAL_COLOR }} />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Equity Fan</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: SAMPLE_PALETTE[2] }} /> Simulated paths
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: MEDIAN_COLOR }} /> Median
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: REAL_COLOR }} /> Real Strategy
          </span>
        </div>
      </div>

      <div className="h-[360px] px-2 pb-2 pt-1">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            No simulation path data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis
                dataKey="step"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `${v >= 0 ? "+" : ""}$${(v / 1000).toFixed(1)}k`}
                width={56}
              />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
              <RechartsTooltip content={<FanTooltip />} />
              {simIds.map((simId, i) => (
                <Line
                  key={simId}
                  type="monotone"
                  dataKey={`sim_${simId}`}
                  stroke={SAMPLE_PALETTE[i % SAMPLE_PALETTE.length]}
                  strokeWidth={1}
                  strokeOpacity={0.15}
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
              ))}
              <Line
                type="monotone"
                dataKey="median"
                stroke={MEDIAN_COLOR}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="real"
                stroke={REAL_COLOR}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: REAL_COLOR }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
