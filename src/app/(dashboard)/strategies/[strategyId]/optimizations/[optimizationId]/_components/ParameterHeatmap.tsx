"use client";

import React, { useMemo, useState } from "react";
import type { OptimizationAllResultRow } from "@/types/optimization";
import { IconLayoutGrid, IconInfoCircle } from "@tabler/icons-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizationSectionCard } from "./OptimizationSectionCard";
import { formatParamKey } from "@/components/backtest/metric-format";

interface ParameterHeatmapProps {
  results: OptimizationAllResultRow[];
  searchType: "grid" | "random";
}

function cellStyle(normalized: number): React.CSSProperties {
  // normalized in [0,1], 1 = best score in this grid.
  const varName = normalized >= 0.5 ? "--chart-2" : "--destructive";
  const intensity = Math.abs(normalized - 0.5) * 2; // 0 at midpoint, 1 at extremes
  return {
    backgroundColor: `color-mix(in oklch, var(${varName}) ${10 + intensity * 70}%, transparent)`,
  };
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <OptimizationSectionCard title="Parameter Heatmap" icon={IconLayoutGrid}>
      <div className="flex items-start gap-1.5">
        <IconInfoCircle className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
        <p className="text-[13px] text-muted-foreground">{children}</p>
      </div>
    </OptimizationSectionCard>
  );
}

export function ParameterHeatmap({ results, searchType }: ParameterHeatmapProps) {
  const paramNames = useMemo(() => {
    if (results.length === 0) return [];
    return Object.keys(results[0].parameters);
  }, [results]);

  const [axisX, setAxisX] = useState<string | null>(paramNames[1] ?? paramNames[0] ?? null);
  const [axisY, setAxisY] = useState<string | null>(paramNames[0] ?? null);

  if (searchType !== "grid") {
    return (
      <EmptyState>
        Random search samples aren&apos;t arranged on a grid, so a heatmap would misrepresent
        coverage — use the sensitivity scatter below instead.
      </EmptyState>
    );
  }

  if (paramNames.length < 2 || !axisX || !axisY) {
    return (
      <EmptyState>
        Needs at least 2 swept parameters — this run swept {paramNames.length}. See the
        sensitivity scatter below instead.
      </EmptyState>
    );
  }

  const xValues = Array.from(new Set(results.map((r) => r.parameters[axisX]))).sort((a, b) => a - b);
  const yValues = Array.from(new Set(results.map((r) => r.parameters[axisY]))).sort((a, b) => a - b);

  const scores = results.map((r) => r.objective_score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;

  // Marginalize over any other swept parameters by taking the best score per (x,y) cell.
  const cellScore = new Map<string, number>();
  for (const r of results) {
    const key = `${r.parameters[axisY]}|${r.parameters[axisX]}`;
    const existing = cellScore.get(key);
    if (existing === undefined || r.objective_score > existing) {
      cellScore.set(key, r.objective_score);
    }
  }

  return (
    <OptimizationSectionCard
      title="Parameter Heatmap"
      subtitle={paramNames.length > 2 ? `Marginalized over other swept parameters — best score at each (${formatParamKey(axisY)}, ${formatParamKey(axisX)}) combination` : undefined}
      icon={IconLayoutGrid}
      badge={
        paramNames.length > 2 ? (
          <div className="flex items-center gap-2">
            <Select value={axisY} onValueChange={setAxisY}>
              <SelectTrigger size="sm" className="h-7 text-[12.5px] w-auto min-w-24">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {paramNames.map((p) => (
                  <SelectItem key={p} value={p} className="text-[12.5px]">{formatParamKey(p)} (rows)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={axisX} onValueChange={setAxisX}>
              <SelectTrigger size="sm" className="h-7 text-[12.5px] w-auto min-w-24">
                <SelectValue placeholder="Cols" />
              </SelectTrigger>
              <SelectContent>
                {paramNames.map((p) => (
                  <SelectItem key={p} value={p} className="text-[12.5px]">{formatParamKey(p)} (cols)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : undefined
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border/30">
        <table className="border-collapse w-full">
          <thead>
            <tr className="bg-muted/[0.04]">
              <th className="w-16" />
              {xValues.map((x) => (
                <th key={x} className="px-2 py-1.5 text-[11.5px] font-mono font-semibold text-muted-foreground">{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yValues.map((y) => (
              <tr key={y}>
                <th className="px-2 py-1 text-[11.5px] font-mono font-semibold text-muted-foreground text-right">{y}</th>
                {xValues.map((x) => {
                  const score = cellScore.get(`${y}|${x}`);
                  if (score === undefined) return <td key={x} className="w-14 h-10" />;
                  const normalized = range > 0 ? (score - min) / range : 0.5;
                  return (
                    <td
                      key={x}
                      className="w-14 h-10 text-center align-middle rounded-md border border-border/20 text-[11.5px] font-mono font-semibold"
                      style={cellStyle(normalized)}
                      title={`${axisY}=${y}, ${axisX}=${x}: ${score.toFixed(3)}`}
                    >
                      {score.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-muted-foreground/50 mt-3">
        Axes: {formatParamKey(axisY)} (rows) &times; {formatParamKey(axisX)} (cols). Color = objective score,
        relative to this run&apos;s own min/max — green higher, red lower.
      </p>
    </OptimizationSectionCard>
  );
}
