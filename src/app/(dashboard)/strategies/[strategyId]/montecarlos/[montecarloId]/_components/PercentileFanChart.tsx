"use client";

import React, { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { PercentileBandRow } from "@/types/montecarlo";

interface PercentileFanChartProps {
  /** Rows already filtered to one metric ("equity" or "drawdown") by the caller. */
  rows: PercentileBandRow[];
  title: string;
  color?: string;
  /** true for equity (subtract the step-0 median so it reads as cumulative
   * P&L, matching EquityFanChart's convention) — false for drawdown, which
   * already starts at 0 by definition. */
  zeroBaseline?: boolean;
  valueFormatter?: (v: number) => string;
  isLoading?: boolean;
}

interface Point {
  step: number;
  band90: [number, number];
  band75: [number, number];
  median: number;
  p10: number;
  p90: number;
  p25: number;
  p75: number;
}

function FanBandTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  label?: number;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[170px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">Step {label}</p>
      <div className="flex flex-col gap-1 text-[11px]">
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">P90</span><span className="font-mono font-medium">{valueFormatter(p.p90)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">P75</span><span className="font-mono font-medium">{valueFormatter(p.p75)}</span></div>
        <div className="flex justify-between gap-4 border-t border-border/40 pt-1 mt-0.5"><span className="text-foreground/80 font-medium">Median</span><span className="font-mono font-semibold">{valueFormatter(p.median)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">P25</span><span className="font-mono font-medium">{valueFormatter(p.p25)}</span></div>
        <div className="flex justify-between gap-4"><span className="text-muted-foreground">P10</span><span className="font-mono font-medium">{valueFormatter(p.p10)}</span></div>
      </div>
    </div>
  );
}

export function PercentileFanChart({
  rows,
  title,
  color = "#818cf8",
  zeroBaseline = false,
  valueFormatter = (v) => v.toFixed(1),
  isLoading = false,
}: PercentileFanChartProps) {
  const data = useMemo<Point[]>(() => {
    if (rows.length === 0) return [];
    const sorted = [...rows].sort((a, b) => a.step - b.step);
    const baseline = zeroBaseline ? (sorted[0]?.p50 ?? 0) : 0;
    return sorted.map((r) => ({
      step: r.step,
      band90: [r.p10 - baseline, r.p90 - baseline],
      band75: [r.p25 - baseline, r.p75 - baseline],
      median: r.p50 - baseline,
      p10: r.p10 - baseline,
      p90: r.p90 - baseline,
      p25: r.p25 - baseline,
      p75: r.p75 - baseline,
    }));
  }, [rows, zeroBaseline]);

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} /> P10–P90
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} /> Median
          </span>
        </div>
      </div>

      <div className="h-[300px] px-2 pb-2 pt-1">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            No percentile band data
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
                tickFormatter={valueFormatter}
                width={56}
              />
              {zeroBaseline && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />}
              <RechartsTooltip content={<FanBandTooltip valueFormatter={valueFormatter} />} />
              <Area
                dataKey="band90"
                stroke="none"
                fill={color}
                fillOpacity={0.1}
                isAnimationActive={false}
                activeDot={false}
              />
              <Area
                dataKey="band75"
                stroke="none"
                fill={color}
                fillOpacity={0.22}
                isAnimationActive={false}
                activeDot={false}
              />
              <Line type="monotone" dataKey="median" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
