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

interface EquityCurveChartProps {
  equityData: { time: any; formattedTime: string; balance: number }[];
  isProfit: boolean;
}

/* Use CSS var values for chart colors (recharts needs raw hex/rgb) */
const PROFIT_COLOR = "#34d399";  // emerald-400 — same hue as --success
const LOSS_COLOR = "#f87171";    // red-400 — same hue as --destructive

export function EquityCurveChart({ equityData, isProfit }: EquityCurveChartProps) {
  const color = isProfit ? PROFIT_COLOR : LOSS_COLOR;

  return (
    <div className="h-full rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Equity Curve</h3>
        </div>
        {equityData.length > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground/60">
            {equityData.length.toLocaleString()} pts
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[340px] px-2 pb-2">
        {equityData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            No equity data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 20, right: 16, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={52}
              />
              <RechartsTooltip
                content={
                  <ChartTooltip
                    valueLabel="Equity"
                    valueFormatter={(v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    accentColor={color}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={color}
                strokeWidth={1.5}
                fill="url(#eqGrad)"
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
