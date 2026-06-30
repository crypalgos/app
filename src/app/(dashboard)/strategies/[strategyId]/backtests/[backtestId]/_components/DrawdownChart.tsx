"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface DrawdownChartProps {
  drawdownData: { time: any; formattedTime: string; value: number }[];
  title?: string;
  color?: string;
  dataKey?: string;
  valueFormatter?: (v: any) => string;
  valueLabel?: string;
  emptyText?: string;
  yAxisFormatter?: (v: any) => string;
}

export function DrawdownChart({
  drawdownData,
  title = "Drawdown",
  color = "#fb7185",
  dataKey = "value",
  valueFormatter = (v) => `${Number(v).toFixed(2)}%`,
  valueLabel = "Drawdown",
  emptyText = "No drawdown data available",
  yAxisFormatter = (v) => `${v}%`,
}: DrawdownChartProps) {
  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40">
        <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
      </div>

      {/* Chart */}
      <div className="h-[280px] px-2 pb-2 pt-1">
        {drawdownData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.4}
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
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={yAxisFormatter}
                width={48}
              />
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
                fill="url(#ddGrad)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
