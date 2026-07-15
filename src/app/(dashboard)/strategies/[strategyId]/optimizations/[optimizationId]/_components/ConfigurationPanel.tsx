"use client";

import React from "react";
import type { ParameterDefinition, Constraint } from "@/types/optimization";

interface OptimizationMetadata {
  strategy_id: string;
  run_id: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  parameter_space: ParameterDefinition[];
  constraints: Constraint[];
  search_type: string;
  objective: string;
  max_runs: number;
}

export function ConfigurationPanel({ metadata }: { metadata: OptimizationMetadata | undefined }) {
  if (!metadata) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-3">Run Configuration</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Objective</span><span className="font-mono font-semibold">{metadata.objective}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Search Type</span><span className="font-mono">{metadata.search_type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Max Runs</span><span className="font-mono">{metadata.max_runs}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Initial Capital</span><span className="font-mono">${metadata.initial_capital.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date Range</span><span className="font-mono text-[10px]">{metadata.start_date.slice(0, 10)} → {metadata.end_date.slice(0, 10)}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-3">Parameter Space</h3>
        <div className="space-y-2">
          {metadata.parameter_space.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-xs rounded-lg border border-border/30 bg-muted/5 px-3 py-1.5">
              <span className="font-mono text-muted-foreground">{p.name}</span>
              <span className="font-mono">
                {p.type === "categorical" ? p.choices?.join(", ") : `${p.min_val} – ${p.max_val} (step ${p.step})`}
              </span>
            </div>
          ))}
        </div>
        {metadata.constraints.length > 0 && (
          <>
            <h4 className="text-[11px] font-semibold text-foreground/70 mt-4 mb-2">Constraints</h4>
            <div className="space-y-1.5">
              {metadata.constraints.map((c, i) => (
                <div key={i} className="text-xs font-mono text-muted-foreground">
                  {c.metric} {c.operator} {c.value}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
