"use client";

import React, { useId } from "react";
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
import { ChartTooltip } from "./ChartTooltip";
import { IconTrendingDown } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DrawdownChartProps {
  drawdownData: { time: any; formattedTime: string; value: number }[];
  title?: string;
  color?: string;
  dataKey?: string;
  valueFormatter?: (v: any) => string;
  valueLabel?: string;
  emptyText?: string;
  yAxisFormatter?: (v: any) => string;
  isLoading?: boolean;
}

export function DrawdownChart({
  drawdownData,
  title = "Drawdown",
  color = "#f43f5e",
  dataKey = "value",
  valueFormatter = (v) => `${Number(v).toFixed(2)}%`,
  valueLabel = "Drawdown",
  emptyText = "No drawdown data available",
  yAxisFormatter = (v) => `${Number(v).toFixed(2)}%`,
  isLoading = false,
}: DrawdownChartProps) {
  const gradientId = useId().replace(/:/g, "_");

  // Find max drawdown depth (most negative value)
  const values = drawdownData.map((d) => (d as any)[dataKey] ?? 0);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxDdDisplay = Math.abs(minVal);

  // YAxis domain so 0 is at the top with slight bottom padding
  const yMin = minVal < 0 ? Math.floor(minVal * 1.12 * 100) / 100 : -1;
  const yDomain = [yMin, 0];

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden flex flex-col transition-all duration-200">
      {/* Clean Trading Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {drawdownData.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              Current: {valueFormatter(drawdownData[drawdownData.length - 1]?.value ?? 0)}
            </span>
          )}
        </div>

        {drawdownData.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">Max Depth:</span>
            <span className="text-rose-500 font-bold">-{maxDdDisplay.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[300px] px-3 pb-3 pt-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-full w-full rounded-lg bg-muted/30" />
          </div>
        ) : drawdownData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground italic">
            {emptyText}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id={`ddGrad_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="60%" stopColor={color} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.25}
              />
              <XAxis
                dataKey="formattedTime"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                domain={yDomain}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={yAxisFormatter}
                width={56}
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" strokeWidth={1} />
              <RechartsTooltip
                content={
                  <ChartTooltip
                    valueLabel={valueLabel}
                    valueFormatter={valueFormatter}
                    accentColor={color}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#ddGrad_${gradientId})`}
                dot={false}
                activeDot={{
                  r: 3.5,
                  strokeWidth: 1.5,
                  stroke: "var(--background)",
                  fill: color,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
