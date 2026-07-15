"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IconGitCompare } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { StrategyActions } from "@/api-actions/strategy-actions";

export interface ComparisonMetric {
  label: string;
  current: number | string | null;
  other: number | string | null;
  /** Higher is better (default true) — drives which side gets the "winner" highlight for numeric metrics. */
  higherIsBetter?: boolean;
}

interface ComparisonDialogProps {
  strategyId: string;
  currentRunId: string;
  currentRunName: string;
  /** "optimizations" | "walkforwards" — matches the list-runs route segment. */
  runType: "optimizations" | "walkforwards";
  listRuns: (strategyId: string) => Promise<{ runs: { id: string; name: string; status: string; completed_at?: string | null }[] }>;
  /** Given the raw "report" artifact for a run, extract the comparable metric list. */
  extractMetrics: (report: unknown) => ComparisonMetric[];
}

export function ComparisonDialog({
  strategyId,
  currentRunId,
  currentRunName,
  runType,
  listRuns,
  extractMetrics,
}: ComparisonDialogProps) {
  const [open, setOpen] = useState(false);
  const [otherRunId, setOtherRunId] = useState<string | null>(null);

  const { data: runsList } = useQuery({
    queryKey: ["strategies", strategyId, runType, "comparison-list"],
    queryFn: () => listRuns(strategyId),
    enabled: open,
  });

  const candidates = (runsList?.runs ?? []).filter((r) => r.id !== currentRunId && r.status === "COMPLETED");

  const { data: currentReport } = useQuery({
    queryKey: ["runs", currentRunId, "artifacts", "report"],
    queryFn: () => StrategyActions.getRunArtifact(currentRunId, "report"),
    enabled: open,
  });

  const { data: otherReport } = useQuery({
    queryKey: ["runs", otherRunId, "artifacts", "report"],
    queryFn: () => StrategyActions.getRunArtifact(otherRunId!, "report"),
    enabled: open && !!otherRunId,
  });

  const metrics = currentReport && otherReport ? extractMetrics(currentReport).map((m, i) => ({ ...m, other: extractMetrics(otherReport)[i]?.other ?? null })) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <IconGitCompare className="size-3.5" />
          Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compare Runs</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Compare</span>
          <span className="font-semibold">{currentRunName}</span>
          <span className="text-muted-foreground">against</span>
          <select
            className="bg-muted/20 border border-border/40 rounded-md px-2 py-1 flex-1"
            value={otherRunId ?? ""}
            onChange={(e) => setOtherRunId(e.target.value || null)}
          >
            <option value="">Select a run...</option>
            {candidates.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {otherRunId && (
          <div className="mt-4 rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="text-left font-medium px-4 py-2">Metric</th>
                  <th className="text-right font-medium px-4 py-2">This Run</th>
                  <th className="text-right font-medium px-4 py-2">Compared Run</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const higherIsBetter = m.higherIsBetter ?? true;
                  const bothNumeric = typeof m.current === "number" && typeof m.other === "number";
                  const currentWins = bothNumeric && (higherIsBetter ? (m.current as number) > (m.other as number) : (m.current as number) < (m.other as number));
                  const otherWins = bothNumeric && (higherIsBetter ? (m.other as number) > (m.current as number) : (m.other as number) < (m.current as number));
                  return (
                    <tr key={m.label} className="border-b border-border/20">
                      <td className="px-4 py-2 text-muted-foreground">{m.label}</td>
                      <td className={cn("px-4 py-2 text-right font-mono font-semibold", currentWins && "text-emerald-400")}>{m.current ?? "—"}</td>
                      <td className={cn("px-4 py-2 text-right font-mono font-semibold", otherWins && "text-emerald-400")}>{m.other ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
