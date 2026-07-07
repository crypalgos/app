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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { IconActivity } from "@tabler/icons-react";
import { ChartTooltip } from "./ChartTooltip";

interface RollingMetricsChartProps {
  rollingData: { time: any; formattedTime: string; value: number }[];
  selectedRolling: string;
  selectedWindow: string;
  onRollingChange: (val: string) => void;
  onWindowChange: (val: string) => void;
  isLoading?: boolean;
  showCorrelation?: boolean;
}

const ROLLING_OPTIONS = [
  { value: "sharpe", label: "Sharpe" },
  { value: "sortino", label: "Sortino" },
  { value: "drawdown", label: "Drawdown" },
  { value: "volatility", label: "Volatility" },
  { value: "correlation", label: "Correlation" },
];

const WINDOW_OPTIONS = [
  { value: "30D", label: "30D" },
  { value: "60D", label: "60D" },
  { value: "90D", label: "90D" },
];

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border border-border/40">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-150 whitespace-nowrap",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function RollingMetricsChart({
  rollingData,
  selectedRolling,
  selectedWindow,
  onRollingChange,
  onWindowChange,
  isLoading = false,
  showCorrelation = true,
}: RollingMetricsChartProps) {
  const metricLabel = ROLLING_OPTIONS.find((o) => o.value === selectedRolling)?.label ?? selectedRolling;
  const metricOptions = showCorrelation ? ROLLING_OPTIONS : ROLLING_OPTIONS.filter((o) => o.value !== "correlation");

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col">
      {/* Header with selectors */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40 flex-wrap">
        <div className="flex items-center gap-2">
          <IconActivity className="size-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Rolling</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PillGroup options={metricOptions} value={selectedRolling} onChange={onRollingChange} />
          <PillGroup options={WINDOW_OPTIONS} value={selectedWindow} onChange={onWindowChange} />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] px-2 pb-2 pt-1">
        {isLoading ? (
          <div className="flex h-full flex-col justify-end gap-2 px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : rollingData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            No {metricLabel.toLowerCase()} data for this window
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
