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

interface HistogramChartProps {
  title: string;
  values: number[];
  color: string;
  isLoading?: boolean;
  binCount?: number;
  valueFormatter?: (v: number) => string;
  /** Colors bars red/green either side of zero instead of a flat accent — useful for return-like metrics. */
  signAware?: boolean;
}

interface Bin {
  index: number;
  x0: number;
  x1: number;
  count: number;
  mid: number;
}

// A near-zero-variance distribution (e.g. a backtest with almost no distinct
// trade outcomes to bootstrap from) makes evenly-spaced bins collapse to
// float-precision-sized widths — adjacent bins end up with visually-identical
// labels and near-duplicate x-positions, which made hover/tooltip resolution
// pick the wrong bin. Collapsing to a single bin below this threshold avoids
// manufacturing fake resolution the data doesn't have.
const DEGENERATE_RELATIVE_SPREAD = 1e-6;

function buildBins(values: number[], binCount: number): Bin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scale = Math.max(Math.abs(min), Math.abs(max), 1e-9);
  if ((max - min) / scale < DEGENERATE_RELATIVE_SPREAD) {
    return [{ index: 0, x0: min, x1: max, count: values.length, mid: (min + max) / 2 }];
  }
  const width = (max - min) / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    index: i,
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
    mid: min + (i + 0.5) * width,
  }));
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.max(0, Math.floor((v - min) / width)));
    bins[idx].count += 1;
  }
  return bins;
}

function HistogramTooltip({
  active,
  payload,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { payload: Bin }[];
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const bin = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[150px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">
        {valueFormatter(bin.x0)} – {valueFormatter(bin.x1)}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Simulations</span>
        <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">{bin.count}</span>
      </div>
    </div>
  );
}

const POSITIVE_COLOR = "#34d399"; // emerald-400
const NEGATIVE_COLOR = "#f87171"; // red-400

export function HistogramChart({
  title,
  values,
  color,
  isLoading = false,
  binCount = 24,
  valueFormatter = (v) => v.toFixed(2),
  signAware = false,
}: HistogramChartProps) {
  const bins = useMemo(() => buildBins(values, binCount), [values, binCount]);
  const mean = useMemo(() => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null), [values]);
  // Nearest bin index for the mean marker — ReferenceLine on a categorical
  // axis needs an index, not the raw float value.
  const meanBinIndex = useMemo(() => {
    if (mean == null || bins.length === 0) return null;
    let closest = bins[0].index;
    let closestDist = Math.abs(bins[0].mid - mean);
    for (const b of bins) {
      const dist = Math.abs(b.mid - mean);
      if (dist < closestDist) {
        closest = b.index;
        closestDist = dist;
      }
    }
    return closest;
  }, [mean, bins]);
  // Green = good outcome, red = bad — matches signAware bar coloring instead
  // of always showing the same accent dot regardless of whether this run's
  // data is actually positive or negative.
  const headerColor = signAware && mean != null ? (mean >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR) : color;

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: headerColor }} />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        </div>
        {values.length > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground/60">{values.length.toLocaleString()} sims</span>
        )}
      </div>

      <div className="h-[220px] px-2 pb-2 pt-2">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : bins.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bins} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              {/* Categorical index axis — bins are guaranteed evenly spaced
                  and uniquely resolvable on hover, regardless of how close
                  together the underlying float values are. */}
              <XAxis
                dataKey="index"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                tickFormatter={(i: number) => valueFormatter(bins[i]?.mid ?? 0)}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={28} />
              {meanBinIndex != null && (
                <ReferenceLine x={meanBinIndex} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
              )}
              <RechartsTooltip content={<HistogramTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {bins.map((bin, i) => (
                  <Cell key={i} fill={signAware ? (bin.mid >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR) : color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
