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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconActivity } from "@tabler/icons-react";
import { ChartTooltip } from "./ChartTooltip";

interface RollingMetricsChartProps {
  rollingData: { time: any; formattedTime: string; value: number }[];
  selectedRolling: string;
  selectedWindow: string;
  onRollingChange: (val: string) => void;
  onWindowChange: (val: string) => void;
}

const ROLLING_OPTIONS = [
  { value: "sharpe", label: "Sharpe" },
  { value: "sortino", label: "Sortino" },
  { value: "drawdown", label: "Drawdown" },
  { value: "volatility", label: "Volatility" },
];

const WINDOW_OPTIONS = [
  { value: "30D", label: "30D" },
  { value: "60D", label: "60D" },
  { value: "90D", label: "90D" },
];

export function RollingMetricsChart({
  rollingData,
  selectedRolling,
  selectedWindow,
  onRollingChange,
  onWindowChange,
}: RollingMetricsChartProps) {
  const metricLabel = ROLLING_OPTIONS.find((o) => o.value === selectedRolling)?.label ?? selectedRolling;

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      {/* Header with selectors */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <IconActivity className="size-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Rolling</h3>
        </div>

        <div className="flex gap-1.5">
          <Select value={selectedRolling} onValueChange={onRollingChange}>
            <SelectTrigger className="h-7 w-[100px] text-[11px] bg-muted border-border rounded-md px-2.5 text-foreground focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {ROLLING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[12px] text-foreground">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedWindow} onValueChange={onWindowChange}>
            <SelectTrigger className="h-7 w-[68px] text-[11px] bg-muted border-border rounded-md px-2.5 text-foreground focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {WINDOW_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[12px] text-foreground">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] px-2 pb-2 pt-1">
        {rollingData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            Select a metric to load rolling data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rollingData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="rlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
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
                width={44}
              />
              <RechartsTooltip
                content={
                  <ChartTooltip
                    valueLabel={metricLabel}
                    valueFormatter={(v) => Number(v).toFixed(3)}
                    accentColor="#818cf8"
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#818cf8"
                strokeWidth={1.5}
                fill="url(#rlGrad)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "#818cf8" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
