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
import type { PercentileBandRow, RealEquityRow } from "@/types/montecarlo";

interface PercentileFanChartProps {
  /** Rows already filtered to one metric ("equity" or "drawdown") by the caller. */
  rows: PercentileBandRow[];
  title: string;
  color?: string;
  /** true for equity (subtract the step-0 median so it reads as cumulative
   * P&L, matching SpaghettiFanChart's convention) — false for drawdown, which
   * already starts at 0 by definition. */
  zeroBaseline?: boolean;
  /** Optional real-strategy overlay — same baseline convention as the band data. */
  realRows?: RealEquityRow[];
  realField?: "equity" | "drawdown";
  realColor?: string;
  valueFormatter?: (v: number) => string;
  isLoading?: boolean;
}

interface Point {
  step: number;
  band99: [number, number];
  band95: [number, number];
  band90: [number, number];
  band75: [number, number];
  median: number;
  p01: number; p05: number; p10: number; p25: number;
  p75: number; p90: number; p95: number; p99: number;
  real?: number;
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
  const rows: [string, number][] = [
    ["P99", p.p99], ["P95", p.p95], ["P90", p.p90], ["P75", p.p75],
  ];
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[170px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5 tracking-wide">Step {label}</p>
      <div className="flex flex-col gap-1 text-[12px]">
        {rows.map(([label2, val]) => (
          <div key={label2} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label2}</span>
            <span className="font-mono font-medium">{valueFormatter(val)}</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-border/40 pt-1 mt-0.5">
          <span className="text-foreground/80 font-medium">Median</span>
          <span className="font-mono font-semibold">{valueFormatter(p.median)}</span>
        </div>
        {([["P25", p.p25], ["P10", p.p10], ["P05", p.p05], ["P01", p.p01]] as [string, number][]).map(([label2, val]) => (
          <div key={label2} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label2}</span>
            <span className="font-mono font-medium">{valueFormatter(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PercentileFanChart({
  rows,
  title,
  color = "#818cf8",
  zeroBaseline = false,
  realRows,
  realField = "equity",
  realColor = "var(--primary)",
  valueFormatter = (v) => v.toFixed(1),
  isLoading = false,
}: PercentileFanChartProps) {
  const data = useMemo<Point[]>(() => {
    if (rows.length === 0) return [];
    const sorted = [...rows].sort((a, b) => a.step - b.step);
    const baseline = zeroBaseline ? (sorted[0]?.p50 ?? 0) : 0;
    return sorted.map((r) => ({
      step: r.step,
      band99: [r.p01 - baseline, r.p99 - baseline],
      band95: [r.p05 - baseline, r.p95 - baseline],
      band90: [r.p10 - baseline, r.p90 - baseline],
      band75: [r.p25 - baseline, r.p75 - baseline],
      median: r.p50 - baseline,
      p01: r.p01 - baseline, p05: r.p05 - baseline, p10: r.p10 - baseline, p25: r.p25 - baseline,
      p75: r.p75 - baseline, p90: r.p90 - baseline, p95: r.p95 - baseline, p99: r.p99 - baseline,
      real: realRows?.[r.step] ? realRows[r.step][realField] - baseline : undefined,
    }));
  }, [rows, zeroBaseline, realRows, realField]);

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-[15px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color, opacity: 0.18 }} /> P1–P99
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color, opacity: 0.35 }} /> P5–P95
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color, opacity: 0.55 }} /> P25–P75
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} /> Median
          </span>
          {realRows && (
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ backgroundColor: realColor }} /> Real
            </span>
          )}
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
              <Area dataKey="band99" stroke="none" fill={color} fillOpacity={0.08} isAnimationActive={false} activeDot={false} />
              <Area dataKey="band95" stroke="none" fill={color} fillOpacity={0.14} isAnimationActive={false} activeDot={false} />
              <Area dataKey="band90" stroke="none" fill={color} fillOpacity={0.2} isAnimationActive={false} activeDot={false} />
              <Area dataKey="band75" stroke="none" fill={color} fillOpacity={0.3} isAnimationActive={false} activeDot={false} />
              <Line type="monotone" dataKey="median" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              {realRows && (
                <Line
                  type="monotone"
                  dataKey="real"
                  stroke={realColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 1.5, stroke: "var(--background)", fill: realColor }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
