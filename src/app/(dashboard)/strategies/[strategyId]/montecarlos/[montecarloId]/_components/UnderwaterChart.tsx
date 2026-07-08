"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
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

interface UnderwaterChartProps {
  rows: RealEquityRow[];
  isLoading?: boolean;
}

const DD_COLOR = "#f87171"; // red-400

function UnderwaterTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[150px]">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">Step {label}</p>
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: DD_COLOR }} />
        <span className="text-[11px] text-muted-foreground">Underwater</span>
        <span className="text-[13px] font-semibold font-mono text-destructive ml-auto tabular-nums">
          {payload[0].value.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/** Classic underwater-equity chart — the real strategy's drawdown % as a
 * single series, filled from 0 downward. Distinct from the percentile/
 * spaghetti drawdown charts: one line, not a distribution. */
export function UnderwaterChart({ rows, isLoading }: UnderwaterChartProps) {
  const data = useMemo(
    () => [...rows].sort((a, b) => a.step - b.step).map((r) => ({ step: r.step, underwater: -r.drawdown })),
    [rows]
  );

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: DD_COLOR }} />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Underwater Chart</h3>
        </div>
        <span className="text-[10px] text-muted-foreground/70 font-mono">Real Strategy</span>
      </div>

      <div className="h-[220px] px-2 pb-2 pt-2">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="underwaterFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={DD_COLOR} stopOpacity={0.05} />
                  <stop offset="100%" stopColor={DD_COLOR} stopOpacity={0.35} />
                </linearGradient>
              </defs>
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
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                width={44}
              />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
              <RechartsTooltip content={<UnderwaterTooltip />} />
              <Area
                type="monotone"
                dataKey="underwater"
                stroke={DD_COLOR}
                strokeWidth={1.5}
                fill="url(#underwaterFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
