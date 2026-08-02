"use client";

import React, { useState, useMemo, useId } from "react";
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
import { cn } from "@/lib/utils";
import { IconActivity } from "@tabler/icons-react";
import { ChartTooltip } from "./ChartTooltip";
import { useRunDataset } from "@/api-actions/hooks/strategy-hooks";
import type { AnalyticsReport } from "@/types/backtest";
import { Badge } from "@/components/ui/badge";

interface SingleRollingCardProps {
  title: string;
  backtestId: string;
  datasetId: string | null;
  selectedWindow: string;
  onWindowChange: (w: string) => void;
  accentColor: string;
  isFullWidth?: boolean;
  showZeroLine?: boolean;
  valueFormatter?: (v: number) => string;
}

function SingleRollingCard({
  title,
  backtestId,
  datasetId,
  selectedWindow,
  onWindowChange,
  accentColor,
  isFullWidth = false,
  showZeroLine = false,
  valueFormatter = (v) => Number(v).toFixed(3),
}: SingleRollingCardProps) {
  const gradientId = useId().replace(/:/g, "_");
  const { data: rawData, isLoading } = useRunDataset(backtestId, datasetId);

  const chartData = useMemo(() => {
    return (Array.isArray(rawData) ? rawData : []).map((item: any) => {
      const time = Array.isArray(item) ? item[0] : item.timestamp;
      const value = Array.isArray(item) ? item[1] : item.value;
      return {
        time,
        formattedTime: new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
      };
    });
  }, [rawData]);

  const latestVal = chartData.length > 0 ? chartData[chartData.length - 1].value : null;

  // Calculate dynamic padded YAxis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ["auto", "auto"];
    const vals = chartData.map((d) => d.value).filter((v) => typeof v === "number" && !isNaN(v));
    if (vals.length === 0) return ["auto", "auto"];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    return [
      Math.floor((min - range * 0.12) * 100) / 100,
      Math.ceil((max + range * 0.12) * 100) / 100,
    ];
  }, [chartData]);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/30 overflow-hidden flex flex-col min-w-0 transition-all duration-200",
        isFullWidth && "col-span-full w-full"
      )}
    >
      {/* Clean Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {latestVal !== null && (
            <span className="text-xs font-mono text-muted-foreground ml-1">
              ({valueFormatter(latestVal)})
            </span>
          )}
        </div>

        {/* Window Selector */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/60 shadow-2xs">
          {["30D", "60D", "90D"].map((w) => {
            const isActive = selectedWindow === w;
            return (
              <button
                key={w}
                onClick={() => onWindowChange(w)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] tracking-wide transition-all duration-200 cursor-pointer select-none",
                  isActive
                    ? "bg-card text-primary shadow-2xs border border-border/70 font-bold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 font-medium"
                )}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={cn("px-3 pb-3 pt-3", isFullWidth ? "h-[290px]" : "h-[270px]")}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground italic">
            No data available for {title} ({selectedWindow})
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id={`rlGrad_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                  <stop offset="60%" stopColor={accentColor} stopOpacity={0.05} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.25} />
              <XAxis dataKey="formattedTime" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" minTickGap={60} />
              <YAxis domain={yDomain} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={48} />
              {showZeroLine && <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" strokeWidth={1} />}
              <RechartsTooltip content={<ChartTooltip valueLabel={title} valueFormatter={valueFormatter} accentColor={accentColor} />} />
              <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={1.5} fill={`url(#rlGrad_${gradientId})`} dot={false} activeDot={{ r: 3.5, strokeWidth: 1.5, stroke: "var(--background)", fill: accentColor }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

interface RollingMetricsChartProps {
  backtestId: string;
  runJson: AnalyticsReport;
}

export function RollingMetricsChart({ backtestId, runJson }: RollingMetricsChartProps) {
  const [windows, setWindows] = useState<Record<string, string>>({
    sharpe: "30D",
    sortino: "30D",
    drawdown: "30D",
    volatility: "30D",
    correlation: "30D",
  });

  const updateWindow = (metric: string, w: string) => {
    setWindows((prev) => ({ ...prev, [metric]: w }));
  };

  const datasets = runJson.datasets ?? {};
  const symbolKeys = Object.keys(runJson.metrics?.symbols ?? {});
  const showCorrelation = symbolKeys.length >= 2;
  const correlationPairKey = showCorrelation ? `${symbolKeys[0]}-${symbolKeys[1]}` : null;

  const getDatasetId = (metric: string) => {
    const w = windows[metric] ?? "30D";
    if (metric === "correlation") {
      return runJson.correlations?.rolling?.[w]?.[correlationPairKey ?? ""]?.dataset_id ?? null;
    }
    const record = (datasets as unknown as Record<string, Record<string, { dataset_id?: string }>>)[`rolling_${metric}`];
    return record?.[w]?.dataset_id ?? null;
  };

  const metricsConfig = [
    { key: "sharpe", title: "Rolling Sharpe Ratio", accentColor: "#818cf8", showZeroLine: true, formatter: (v: number) => Number(v).toFixed(3) },
    { key: "sortino", title: "Rolling Sortino Ratio", accentColor: "#34d399", showZeroLine: true, formatter: (v: number) => Number(v).toFixed(3) },
    { key: "drawdown", title: "Rolling Max Drawdown", accentColor: "#f87171", showZeroLine: false, formatter: (v: number) => `${Number(v).toFixed(2)}%` },
    { key: "volatility", title: "Rolling Volatility", accentColor: "#fbbf24", showZeroLine: false, formatter: (v: number) => `${(Number(v) * 100).toFixed(2)}%` },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* 4 Standard Rolling Metric Standalone Charts */}
      {metricsConfig.map((cfg) => (
        <SingleRollingCard
          key={cfg.key}
          title={cfg.title}
          backtestId={backtestId}
          datasetId={getDatasetId(cfg.key)}
          selectedWindow={windows[cfg.key] ?? "30D"}
          onWindowChange={(w) => updateWindow(cfg.key, w)}
          accentColor={cfg.accentColor}
          showZeroLine={cfg.showZeroLine}
          valueFormatter={cfg.formatter}
        />
      ))}

      {/* 5th Rolling Correlation Chart — Full Row width when multi-symbol */}
      {showCorrelation && (
        <SingleRollingCard
          title={`Rolling Correlation (${correlationPairKey})`}
          backtestId={backtestId}
          datasetId={getDatasetId("correlation")}
          selectedWindow={windows.correlation ?? "30D"}
          onWindowChange={(w) => updateWindow("correlation", w)}
          accentColor="#38bdf8"
          isFullWidth={true}
          showZeroLine={true}
          valueFormatter={(v) => Number(v).toFixed(3)}
        />
      )}
    </div>
  );
}
