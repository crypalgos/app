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
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[150px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">
        {valueFormatter(bin.bin_start)} – {valueFormatter(bin.bin_end)}
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
  bins,
  color,
  isLoading = false,
  valueFormatter = (v) => v.toFixed(2),
  signAware = false,
}: HistogramChartProps) {
  const sorted = useMemo(() => [...bins].sort((a, b) => a.bin_index - b.bin_index), [bins]);
  const mean = sorted[0]?.mean ?? null;
  const totalCount = useMemo(() => sorted.reduce((sum, b) => sum + b.count, 0), [sorted]);

  // Nearest bin index for the mean marker — ReferenceLine on a categorical
  // axis needs an index, not the raw float value.
  const meanBinIndex = useMemo(() => {
    if (mean == null || sorted.length === 0) return null;
    let closest = sorted[0].bin_index;
    let closestDist = Math.abs((sorted[0].bin_start + sorted[0].bin_end) / 2 - mean);
    for (const b of sorted) {
      const mid = (b.bin_start + b.bin_end) / 2;
      const dist = Math.abs(mid - mean);
      if (dist < closestDist) {
        closest = b.bin_index;
        closestDist = dist;
      }
    }
    return closest;
  }, [mean, sorted]);

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
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">No data</div>
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
              {meanBinIndex != null && (
                <ReferenceLine x={meanBinIndex} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
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
