"use client";

import React, { useMemo } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { RealEquityRow } from "@/types/montecarlo";

interface RealVsMedianChartProps {
  medianRows: { step: number; p50: number }[];
  realRows: RealEquityRow[];
  field: "equity" | "drawdown";
  valueFormatter?: (v: number) => string;
  isLoading?: boolean;
}

const POSITIVE_COLOR = "#34d399"; // emerald-400
const NEGATIVE_COLOR = "#f87171"; // red-400

interface Point {
  step: number;
  diff: number;
  diffPositive: number;
  diffNegative: number;
}

function DiffTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean;
  payload?: { payload: Point }[];
  label?: number;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[160px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5 tracking-wide">Step {label}</p>
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-muted-foreground">Real − Median</span>
        <span className={`text-[13px] font-semibold font-mono ml-auto tabular-nums ${p.diff >= 0 ? "text-success" : "text-destructive"}`}>
          {p.diff >= 0 ? "+" : ""}{valueFormatter(p.diff)}
        </span>
      </div>
    </div>
  );
}

/** Real strategy vs. the simulated median — positive means the real
 * strategy is outperforming its own Monte Carlo median, negative means
 * it's underperforming. Baseline-independent: real[i] - median[i], the
 * baseline (whatever it is) cancels out of the subtraction. */
export function RealVsMedianChart({ medianRows, realRows, field, valueFormatter = (v) => v.toFixed(1), isLoading }: RealVsMedianChartProps) {
  const data = useMemo<Point[]>(() => {
    const stepCount = Math.min(medianRows.length, realRows.length);
    if (stepCount === 0) return [];
    const sortedMedian = [...medianRows].sort((a, b) => a.step - b.step);
    const sortedReal = [...realRows].sort((a, b) => a.step - b.step);
    return Array.from({ length: stepCount }, (_, i) => {
      const diff = sortedReal[i][field] - sortedMedian[i].p50;
      return {
        step: i,
        diff,
        diffPositive: diff >= 0 ? diff : 0,
        diffNegative: diff < 0 ? diff : 0,
      };
    });
  }, [medianRows, realRows, field]);

  const latestDiff = data.length > 0 ? data[data.length - 1].diff : 0;
  const outperforming = latestDiff >= 0;

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: outperforming ? POSITIVE_COLOR : NEGATIVE_COLOR }} />
          <h3 className="text-[15px] font-semibold text-foreground/80 tracking-wide">Real vs. Median</h3>
        </div>
        {data.length > 0 && (
          <span className={`text-[11.5px] font-mono font-semibold ${outperforming ? "text-success" : "text-destructive"}`}>
            Real {outperforming ? "outperforming" : "underperforming"}
          </span>
        )}
      </div>

      <div className="h-[240px] px-2 pb-2 pt-2">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis
                dataKey="step"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={valueFormatter} width={56} />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
              <RechartsTooltip content={<DiffTooltip valueFormatter={valueFormatter} />} />
              <Area type="monotone" dataKey="diffPositive" stroke={POSITIVE_COLOR} strokeWidth={1.5} fill={POSITIVE_COLOR} fillOpacity={0.25} isAnimationActive={false} />
              <Area type="monotone" dataKey="diffNegative" stroke={NEGATIVE_COLOR} strokeWidth={1.5} fill={NEGATIVE_COLOR} fillOpacity={0.25} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
