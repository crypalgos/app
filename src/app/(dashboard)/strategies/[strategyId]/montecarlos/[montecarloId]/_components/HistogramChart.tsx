"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { DistributionBinRow } from "@/types/montecarlo";

interface HistogramChartProps {
  title: string;
  /** Pre-binned rows from distributions.arrow (ADR-009), already filtered to
   * one metric by the caller. Backend computes bins once — including the
   * near-zero-variance single-bin collapse — the frontend does zero
   * histogram math, just renders what it's given. */
  bins: DistributionBinRow[];
  color: string;
  isLoading?: boolean;
  valueFormatter?: (v: number) => string;
  /** Colors bars red/green either side of zero instead of a flat accent — useful for return-like metrics. */
  signAware?: boolean;
  /** Where the REAL strategy's own value falls, if honestly derivable from
   * already-fetched curve data (only for ending_return / max_drawdown today
   * — every other metric here is a per-simulation statistic the real
   * strategy doesn't have an equivalent single value for without
   * fabricating one). Renders a solid reference line when provided. */
  realValue?: number;
  realColor?: string;
  /** Shown instead of the generic "No data" when bins is genuinely empty —
   * use this to say WHY there's nothing to show (e.g. "0 of 1,000
   * simulations recovered") rather than leaving it ambiguous between "no
   * data" and "fetch failed". */
  emptyMessage?: string;
}

function HistogramTooltip({
  active,
  payload,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { payload: DistributionBinRow }[];
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const bin = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[170px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">
        {valueFormatter(bin.bin_start)} – {valueFormatter(bin.bin_end)}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Simulations</span>
        <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">{bin.count}</span>
      </div>
      <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
        <div className="flex justify-between"><span>Mean</span><span>{valueFormatter(bin.mean)}</span></div>
        <div className="flex justify-between"><span>Median</span><span>{valueFormatter(bin.median)}</span></div>
        <div className="flex justify-between"><span>Std</span><span>{valueFormatter(bin.std)}</span></div>
        <div className="flex justify-between"><span>P05 – P95</span><span>{valueFormatter(bin.p05)} – {valueFormatter(bin.p95)}</span></div>
      </div>
    </div>
  );
}

const POSITIVE_COLOR = "#34d399"; // emerald-400
const NEGATIVE_COLOR = "#f87171"; // red-400

function nearestBinIndex(sorted: DistributionBinRow[], target: number): number | null {
  if (sorted.length === 0) return null;
  let closest = sorted[0].bin_index;
  let closestDist = Math.abs((sorted[0].bin_start + sorted[0].bin_end) / 2 - target);
  for (const b of sorted) {
    const mid = (b.bin_start + b.bin_end) / 2;
    const dist = Math.abs(mid - target);
    if (dist < closestDist) {
      closest = b.bin_index;
      closestDist = dist;
    }
  }
  return closest;
}

export function HistogramChart({
  title,
  bins,
  color,
  isLoading = false,
  valueFormatter = (v) => v.toFixed(2),
  signAware = false,
  realValue,
  realColor = "var(--primary)",
  emptyMessage = "No data",
}: HistogramChartProps) {
  const sorted = useMemo(() => [...bins].sort((a, b) => a.bin_index - b.bin_index), [bins]);
  const median = sorted[0]?.median ?? null;
  const totalCount = useMemo(() => sorted.reduce((sum, b) => sum + b.count, 0), [sorted]);

  // Nearest bin index for the median/real markers — ReferenceLine on a
  // categorical axis needs an index, not the raw float value.
  const medianBinIndex = useMemo(() => (median != null ? nearestBinIndex(sorted, median) : null), [median, sorted]);
  const realBinIndex = useMemo(() => (realValue != null ? nearestBinIndex(sorted, realValue) : null), [realValue, sorted]);

  // Green = good outcome, red = bad — matches signAware bar coloring instead
  // of always showing the same accent dot regardless of whether this run's
  // data is actually positive or negative.
  const headerColor = signAware && median != null ? (median >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR) : color;

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: headerColor }} />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        </div>
        {totalCount > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground/60">{totalCount.toLocaleString()} sims</span>
        )}
      </div>

      <div className="h-[220px] px-2 pb-2 pt-2">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center px-6">
            <p className="text-[13px] text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : sorted.length === 1 ? (
          // Degenerate case: every simulation landed on the same value (e.g.
          // order-invariant metrics like Profit Factor under Trade Shuffle —
          // reordering trades doesn't change their sum, so the ratio is
          // identical across all N runs). A single bar stretched to fill the
          // whole chart reads as a rendering bug, not "no variation" — show
          // the shared value directly instead.
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-[11px] text-muted-foreground">No variation across simulations</span>
            <span className="text-[26px] font-bold font-mono" style={{ color: signAware ? headerColor : color }}>
              {valueFormatter(sorted[0].mean)}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              all {sorted[0].count.toLocaleString()} simulations landed on this value
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              {/* Categorical index axis — bins are guaranteed evenly spaced
                  and uniquely resolvable on hover, regardless of how close
                  together the underlying float values are. */}
              <XAxis
                dataKey="bin_index"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                tickFormatter={(i: number) => valueFormatter(((sorted[i]?.bin_start ?? 0) + (sorted[i]?.bin_end ?? 0)) / 2)}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={28} />
              {medianBinIndex != null && (
                <ReferenceLine x={medianBinIndex} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
              )}
              {realBinIndex != null && (
                <ReferenceLine x={realBinIndex} stroke={realColor} strokeWidth={2} strokeOpacity={0.8} />
              )}
              <RechartsTooltip content={<HistogramTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {sorted.map((bin, i) => (
                  <Cell
                    key={i}
                    fill={signAware ? ((bin.bin_start + bin.bin_end) / 2 >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR) : color}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
