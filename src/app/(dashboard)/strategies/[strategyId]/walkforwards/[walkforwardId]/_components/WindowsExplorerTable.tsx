"use client";

import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatCell, fmtPct, fmtNum, fmtUsd, signClass } from "@/components/shared/report-primitives";
import { formatParamKey } from "@/components/backtest/metric-format";
import { useWalkforwardDataset } from "@/api-actions/hooks/strategy-hooks";
import { WalkforwardLineChart } from "./WalkforwardLineChart";
import type { WalkForwardWindowReport } from "@/types/walkforward";
import { IconListNumbers } from "@tabler/icons-react";

export function WindowsExplorerTable({ windows, runId }: { windows: WalkForwardWindowReport[]; runId: string }) {
  const [selected, setSelected] = useState<WalkForwardWindowReport | null>(null);

  const trainDatasetName = selected ? `window_${selected.window_id}_train` : null;
  const validationDatasetName = selected ? `window_${selected.window_id}_validation` : null;
  const { data: trainRows, isLoading: trainLoading } = useWalkforwardDataset(runId, trainDatasetName);
  const { data: validationRows, isLoading: validationLoading } = useWalkforwardDataset(runId, validationDatasetName);

  const series = useMemo(() => {
    const train = ((trainRows as { equity: number }[] | undefined) ?? []).map((r, i) => ({ step: i, value: r.equity }));
    const validation = ((validationRows as { equity: number }[] | undefined) ?? []).map((r, i) => ({ step: i, value: r.equity }));
    return [
      { key: "train", label: "Train", color: "#60a5fa", points: train },
      { key: "validation", label: "Validation", color: "var(--primary)", points: validation },
    ];
  }, [trainRows, validationRows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <IconListNumbers className="size-3.5 text-blue-500 dark:text-blue-400" />
        </div>
        <span className="text-[13px] text-muted-foreground font-mono">{windows.length} windows</span>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground bg-muted/[0.04] border-b border-border/40">
                <th className="text-left font-medium px-5 py-2.5">#</th>
                <th className="text-left font-medium px-3 py-2.5">Train</th>
                <th className="text-left font-medium px-3 py-2.5">Validation</th>
                <th className="text-left font-medium px-3 py-2.5">Regime</th>
                <th className="text-right font-medium px-3 py-2.5">Val Sharpe</th>
                <th className="text-right font-medium px-3 py-2.5">&Delta; Sharpe</th>
                <th className="text-right font-medium px-3 py-2.5">&Delta; Profit</th>
                <th className="text-left font-medium px-3 py-2.5">Result</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => (
                <tr key={w.window_id} className="border-b border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(w)}>
                  <td className="px-5 py-2.5 font-mono font-bold">{w.window_id}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-muted-foreground">{w.train_start} → {w.train_end}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-muted-foreground">{w.validation_start} → {w.validation_end}</td>
                  <td className="px-3 py-2.5">
                    <Badge className="text-[10.5px] font-bold px-1.5 py-0 bg-muted/80 text-muted-foreground border-transparent">{w.regime}</Badge>
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(w.validation.metrics.sharpe_ratio))}>{fmtNum(w.validation.metrics.sharpe_ratio)}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(w.delta.sharpe))}>{w.delta.sharpe >= 0 ? "+" : ""}{fmtNum(w.delta.sharpe, 4)}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(w.delta.net_profit))}>{fmtUsd(w.delta.net_profit, 0)}</td>
                  <td className="px-3 py-2.5">
                    {w.evaluation.passed
                      ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">Pass</Badge>
                      : <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[11px]">Fail</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[420px] sm:w-[520px] p-0 flex flex-col h-full overflow-hidden">
          {selected && (
            <>
              <SheetHeader className="p-6 pb-4 border-b shrink-0 bg-muted/10">
                <SheetTitle className="text-2xl font-bold tracking-tight">Window {selected.window_id}</SheetTitle>
                <SheetDescription>
                  {selected.regime} &middot; {selected.evaluation.passed ? "Passed" : "Failed"}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 w-full min-h-0">
                <div className="p-6 flex flex-col gap-5">
                  <WalkforwardLineChart title="Train vs Validation Equity" series={series} isLoading={trainLoading || validationLoading} valueFormatter={(v) => v.toFixed(0)} height={200} />

                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Train vs Validation</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <StatCell label="Train Sharpe" value={fmtNum(selected.train.metrics.sharpe_ratio)} />
                      <StatCell label="Val Sharpe" value={fmtNum(selected.validation.metrics.sharpe_ratio)} valueClass={signClass(selected.validation.metrics.sharpe_ratio)} />
                      <StatCell label="Train Net Profit" value={fmtUsd(selected.train.metrics.net_profit, 0)} />
                      <StatCell label="Val Net Profit" value={fmtUsd(selected.validation.metrics.net_profit, 0)} valueClass={signClass(selected.validation.metrics.net_profit)} />
                      <StatCell label="Train Max DD" value={fmtPct(selected.train.metrics.max_drawdown)} />
                      <StatCell label="Val Max DD" value={fmtPct(selected.validation.metrics.max_drawdown)} valueClass="text-destructive" />
                    </div>
                  </div>

                  {selected.evaluation.reasons.length > 0 && (
                    <div>
                      <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Why It {selected.evaluation.passed ? "Passed" : "Failed"}</p>
                      <ul className="space-y-1">
                        {selected.evaluation.reasons.map((r, i) => (
                          <li key={i} className="text-[13px] text-muted-foreground flex items-baseline gap-1.5">
                            <span className="text-muted-foreground/40">&bull;</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Parameters Used</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selected.parameter_set).map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2">
                          <span className="text-[11px] text-muted-foreground block truncate" title={k}>{formatParamKey(k)}</span>
                          <span className="text-base font-mono font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
