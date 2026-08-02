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
import { IconTrendingUp, IconTrendingDown, IconChartLine } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EquityCurveChartProps {
  equityData: { time: any; formattedTime: string; balance: number }[];
  isProfit: boolean;
  isLoading?: boolean;
}

const PROFIT_COLOR = "#10b981"; // Emerald green
const LOSS_COLOR = "#f43f5e";   // Vibrant Rose red

export function EquityCurveChart({ equityData, isProfit, isLoading = false }: EquityCurveChartProps) {
  const gradientId = useId().replace(/:/g, "_");
  const color = isProfit ? PROFIT_COLOR : LOSS_COLOR;

  const startBalance = equityData.length > 0 ? equityData[0].balance : 0;
  const endBalance = equityData.length > 0 ? equityData[equityData.length - 1].balance : 0;
  const netChange = endBalance - startBalance;
  const pctChange = startBalance > 0 ? (netChange / startBalance) * 100 : 0;

  // Calculate dynamic min and max for smooth padded Y-axis
  const balances = equityData.map((d) => d.balance);
  const minVal = balances.length > 0 ? Math.min(...balances) : 0;
  const maxVal = balances.length > 0 ? Math.max(...balances) : 1;
  const range = maxVal - minVal || 1;
  const yDomain = [
    Math.max(0, Math.floor(minVal - range * 0.08)),
    Math.ceil(maxVal + range * 0.08),
  ];

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden flex flex-col transition-all duration-200">
      {/* Clean Trading Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Equity Curve</h3>
          {equityData.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              ${startBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → ${endBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {equityData.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">Net PnL:</span>
            <span className={isProfit ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
              {isProfit ? "+" : ""}${netChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isProfit ? "+" : ""}{pctChange.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[300px] px-3 pb-3 pt-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-full w-full rounded-lg bg-muted/30" />
          </div>
        ) : equityData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground italic">
            No equity data available for this backtest.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id={`eqGrad_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="50%" stopColor={color} stopOpacity={0.06} />
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
                tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                width={56}
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
                fill={`url(#eqGrad_${gradientId})`}
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
