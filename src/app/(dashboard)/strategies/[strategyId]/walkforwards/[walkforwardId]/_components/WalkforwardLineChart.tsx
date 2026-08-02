"use client";

import React, { useMemo } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  points: { step: number; value: number }[];
}

interface WalkforwardLineChartProps {
  title: string;
  series: LineSeries[];
  valueFormatter?: (v: number) => string;
  zeroBaseline?: boolean;
  isLoading?: boolean;
  height?: number;
}

export function WalkforwardLineChart({
  title,
  series,
  valueFormatter = (v) => v.toFixed(2),
  zeroBaseline,
  isLoading,
  height = 260,
}: WalkforwardLineChartProps) {
  const data = useMemo(() => {
    const stepCount = Math.max(0, ...series.map((s) => s.points.length));
    if (stepCount === 0) return [];
    return Array.from({ length: stepCount }, (_, i) => {
      const row: Record<string, number> = { step: i };
      for (const s of series) {
        if (s.points[i]) row[s.key] = s.points[i].value;
      }
      return row;
    });
  }, [series]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const s of series) config[s.key] = { label: s.label, color: s.color };
    return config;
  }, [series]);

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        <div className="flex items-center gap-3">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-mono text-muted-foreground/70">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height }} className="px-2 pb-2 pt-1">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">No data</div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
            <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis dataKey="step" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" minTickGap={60} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={valueFormatter} width={56} />
              {zeroBaseline && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(l) => `Step ${l}`}
                    formatter={(value, name) => (
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <span className="text-muted-foreground">{chartConfig[name as string]?.label ?? String(name)}</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">{valueFormatter(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              {series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} isAnimationActive={false} />
              ))}
            </ComposedChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
