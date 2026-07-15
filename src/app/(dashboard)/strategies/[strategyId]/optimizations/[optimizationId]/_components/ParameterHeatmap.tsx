"use client";

import React, { useMemo, useState } from "react";
import type { OptimizationAllResultRow } from "@/types/optimization";

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

export function ParameterHeatmap({ results, searchType }: ParameterHeatmapProps) {
  const paramNames = useMemo(() => {
    if (results.length === 0) return [];
    return Object.keys(results[0].parameters);
  }, [results]);

  const [axisX, setAxisX] = useState<string | null>(paramNames[1] ?? paramNames[0] ?? null);
  const [axisY, setAxisY] = useState<string | null>(paramNames[0] ?? null);

  if (searchType !== "grid") {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Parameter Heatmap</h3>
        <p className="text-xs text-muted-foreground">
          Random search samples aren&apos;t arranged on a grid, so a heatmap would misrepresent
          coverage — use the sensitivity scatter below instead.
        </p>
      </div>
    );
  }

  if (paramNames.length < 2 || !axisX || !axisY) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-1">Parameter Heatmap</h3>
        <p className="text-xs text-muted-foreground">
          Needs at least 2 swept parameters — this run swept {paramNames.length}. See the
          sensitivity scatter below instead.
        </p>
      </div>
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
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Parameter Heatmap</h3>
        {paramNames.length > 2 && (
          <div className="flex items-center gap-2 text-xs">
            <select
              className="bg-muted/20 border border-border/40 rounded-md px-2 py-1"
              value={axisY}
              onChange={(e) => setAxisY(e.target.value)}
            >
              {paramNames.map((p) => (
                <option key={p} value={p}>{p} (rows)</option>
              ))}
            </select>
            <select
              className="bg-muted/20 border border-border/40 rounded-md px-2 py-1"
              value={axisX}
              onChange={(e) => setAxisX(e.target.value)}
            >
              {paramNames.map((p) => (
                <option key={p} value={p}>{p} (cols)</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {paramNames.length > 2 && (
        <p className="text-[10px] text-muted-foreground/70 mb-3">
          Marginalized over other swept parameters — each cell shows the best score found at that
          ({axisY}, {axisX}) combination.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-16" />
              {xValues.map((x) => (
                <th key={x} className="px-2 py-1 text-[10px] font-mono text-muted-foreground">{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yValues.map((y) => (
              <tr key={y}>
                <th className="px-2 py-1 text-[10px] font-mono text-muted-foreground text-right">{y}</th>
                {xValues.map((x) => {
                  const score = cellScore.get(`${y}|${x}`);
                  if (score === undefined) return <td key={x} className="w-14 h-10" />;
                  const normalized = range > 0 ? (score - min) / range : 0.5;
                  return (
                    <td
                      key={x}
                      className="w-14 h-10 text-center align-middle rounded-md border border-border/20 text-[10px] font-mono font-semibold"
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
      <p className="text-[10px] text-muted-foreground/60 mt-3">
        Axes: {axisY} (rows) &times; {axisX} (cols). Color = objective score, relative to this
        run&apos;s own min/max — green higher, red lower.
      </p>
    </div>
  );
}
