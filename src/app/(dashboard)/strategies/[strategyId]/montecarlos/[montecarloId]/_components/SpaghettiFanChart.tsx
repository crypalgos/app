"use client";

import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SamplePathRow, RealEquityRow } from "@/types/montecarlo";

export interface SimulationHoverStats {
  ending_return: number;
  sharpe: number;
  max_drawdown: number;
}

interface SpaghettiFanChartProps {
  title: string;
  /** Long-format rows from sample_paths.arrow (ADR-009) — grouped client-side by simulation_id. */
  sampleRows: SamplePathRow[];
  /** Which curve to plot from each sample/real row. */
  field: "equity" | "drawdown";
  /** percentile_bands.arrow rows (already filtered to the matching metric), for the p50 median line. */
  medianRows: { step: number; p50: number }[];
  /** The actual backtest's real curve — the bold reference overlay. */
  realRows: RealEquityRow[];
  /** simulation_id -> summary stats, for the hover info panel (Return/Sharpe/Max DD). */
  simulationStats?: Map<number, SimulationHoverStats>;
  /** Subtract the step-0 value so the chart reads as cumulative P&L from 0 — used for equity, not drawdown (which already starts at 0). */
  zeroBaseline?: boolean;
  realColor?: string;
  realLabel?: string;
  valueFormatter?: (v: number) => string;
  isLoading?: boolean;
}

const MEDIAN_COLOR = "#818cf8"; // indigo-400
const SAMPLE_PALETTE = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399",
  "#2dd4bf", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6",
];

function FanTooltip({
  active,
  payload,
  label,
  realLabel,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: number;
  realLabel: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const real = payload.find((p) => p.dataKey === "real");
  const median = payload.find((p) => p.dataKey === "median");
  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border px-4 py-3 rounded-lg shadow-2xl min-w-[170px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5 tracking-wide">Step {label}</p>
      {real && (
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full shrink-0 bg-primary" />
          <span className="text-[12px] text-muted-foreground">{realLabel}</span>
          <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">
            {valueFormatter(real.value)}
          </span>
        </div>
      )}
      {median && (
        <div className="flex items-center gap-2 mt-1">
          <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: MEDIAN_COLOR }} />
          <span className="text-[12px] text-muted-foreground">Median</span>
          <span className="text-[13px] font-semibold font-mono text-foreground ml-auto tabular-nums">
            {valueFormatter(median.value)}
          </span>
        </div>
      )}
      <p className="text-[10.5px] text-muted-foreground/60 mt-1.5">
        {payload.length - (real ? 1 : 0) - (median ? 1 : 0)} simulated paths
      </p>
    </div>
  );
}

function ToggleChip({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-opacity",
        active ? "opacity-100" : "opacity-35 hover:opacity-60"
      )}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] font-mono text-muted-foreground/70">{label}</span>
    </button>
  );
}

export function SpaghettiFanChart({
  title,
  sampleRows,
  field,
  medianRows,
  realRows,
  simulationStats,
  zeroBaseline = false,
  realColor = "var(--primary)",
  realLabel = "Real Strategy",
  valueFormatter = (v) => v.toFixed(2),
  isLoading,
}: SpaghettiFanChartProps) {
  const [showReal, setShowReal] = useState(true);
  const [showMedian, setShowMedian] = useState(true);
  const [showSamples, setShowSamples] = useState(true);
  const [hoveredSimId, setHoveredSimId] = useState<number | null>(null);

  const bySimulation = useMemo(() => {
    const map = new Map<number, SamplePathRow[]>();
    for (const row of sampleRows) {
      const arr = map.get(row.simulation_id);
      if (arr) arr.push(row);
      else map.set(row.simulation_id, [row]);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.step - b.step);
    return map;
  }, [sampleRows]);

  const simIds = useMemo(() => Array.from(bySimulation.keys()).sort((a, b) => a - b), [bySimulation]);

  const data = useMemo(() => {
    const stepCount = Math.max(
      0,
      ...Array.from(bySimulation.values()).map((arr) => arr.length),
      medianRows.length,
      realRows.length
    );
    if (stepCount === 0) return [];

    const baseline = zeroBaseline
      ? realRows[0]?.[field] ?? medianRows[0]?.p50 ?? bySimulation.get(simIds[0])?.[0]?.[field] ?? 0
      : 0;

    return Array.from({ length: stepCount }, (_, i) => {
      const row: Record<string, number> = { step: i };
      for (const simId of simIds) {
        const v = bySimulation.get(simId)?.[i]?.[field];
        if (v != null) row[`sim_${simId}`] = v - baseline;
      }
      if (medianRows[i]) row.median = medianRows[i].p50 - baseline;
      if (realRows[i]) row.real = realRows[i][field] - baseline;
      return row;
    });
  }, [bySimulation, simIds, medianRows, realRows, field, zeroBaseline]);

  const hoveredStats = hoveredSimId != null ? simulationStats?.get(hoveredSimId) : undefined;

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden flex flex-col relative">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: realColor }} />
          <h3 className="text-[15px] font-semibold text-foreground/80 tracking-wide">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <ToggleChip active={showSamples} onClick={() => setShowSamples((v) => !v)} color={SAMPLE_PALETTE[2]} label="Simulations" />
          <ToggleChip active={showMedian} onClick={() => setShowMedian((v) => !v)} color={MEDIAN_COLOR} label="Median" />
          <ToggleChip active={showReal} onClick={() => setShowReal((v) => !v)} color={realColor} label={realLabel} />
        </div>
      </div>

      {hoveredStats && hoveredSimId != null && (
        <div className="absolute top-14 right-4 z-10 bg-popover/95 backdrop-blur-xl border border-border rounded-lg px-3 py-2 shadow-xl text-[11px] pointer-events-none">
          <p className="font-semibold text-foreground mb-1">Simulation #{hoveredSimId}</p>
          <div className="flex flex-col gap-0.5 text-muted-foreground font-mono">
            <span>Return: <span className={hoveredStats.ending_return >= 0 ? "text-success" : "text-destructive"}>{(hoveredStats.ending_return * 100).toFixed(1)}%</span></span>
            <span>Sharpe: {hoveredStats.sharpe.toFixed(2)}</span>
            <span>Max DD: <span className="text-destructive">{hoveredStats.max_drawdown.toFixed(1)}%</span></span>
          </div>
        </div>
      )}

      <div className="h-[340px] px-2 pb-2 pt-1">
        {isLoading ? (
          <div className="flex h-full items-end px-4 pb-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
            No simulation path data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
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
                tickFormatter={valueFormatter}
                width={56}
              />
              {zeroBaseline && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />}
              <RechartsTooltip content={<FanTooltip realLabel={realLabel} valueFormatter={valueFormatter} />} />
              {showSamples &&
                simIds.map((simId, i) => {
                  const isHovered = hoveredSimId === simId;
                  const isDimmed = hoveredSimId != null && !isHovered;
                  return (
                    <Line
                      key={simId}
                      type="monotone"
                      dataKey={`sim_${simId}`}
                      stroke={SAMPLE_PALETTE[i % SAMPLE_PALETTE.length]}
                      strokeWidth={isHovered ? 2.5 : 1}
                      strokeOpacity={isDimmed ? 0.05 : isHovered ? 0.9 : 0.15}
                      dot={false}
                      isAnimationActive={false}
                      legendType="none"
                      onMouseEnter={() => setHoveredSimId(simId)}
                      onMouseLeave={() => setHoveredSimId(null)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                })}
              {showMedian && (
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke={MEDIAN_COLOR}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showReal && (
                <Line
                  type="monotone"
                  dataKey="real"
                  stroke={realColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 1.5, stroke: "var(--background)", fill: realColor }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
