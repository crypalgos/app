"use client";

import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSearch, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { StatCell, fmtPct, fmtNum, fmtSigned, signClass } from "@/components/shared/report-primitives";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationSummaryRow, SamplePathRow } from "@/types/montecarlo";

interface SimulationExplorerTableProps {
  rows: SimulationSummaryRow[];
  /** Only the 40 evenly-sampled simulations carry a full curve — used to
   * render a mini equity/drawdown chart in the drawer when available.
   * Never fabricated for the rest of the rows. */
  samplePaths: SamplePathRow[];
}

const PAGE_SIZE = 15;

type SortKey = "simulation_rank" | "ending_return" | "sharpe" | "max_drawdown" | "recovery_steps" | "trade_count";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "simulation_rank", label: "Rank" },
  { key: "ending_return", label: "Return", align: "right" },
  { key: "sharpe", label: "Sharpe", align: "right" },
  { key: "max_drawdown", label: "Max DD", align: "right" },
  { key: "recovery_steps", label: "Recovery", align: "right" },
  { key: "trade_count", label: "Trades", align: "right" },
];

export function SimulationExplorerTable({ rows, samplePaths }: SimulationExplorerTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("simulation_rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<SimulationSummaryRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => String(r.simulation_id).includes(q) || r.scenario_type.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (av === bv) return 0;
      return av < bv ? -dir : dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sorted, currentPage]
  );

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const selectedCurve = useMemo(() => {
    if (!selected) return null;
    const points = samplePaths
      .filter((p) => p.simulation_id === selected.simulation_id)
      .sort((a, b) => a.step - b.step);
    return points.length > 0 ? points : null;
  }, [selected, samplePaths]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search simulation or scenario..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">{rows.length.toLocaleString()} simulations</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                <th className="text-left font-medium px-5 py-2.5">Simulation</th>
                <th className="text-left font-medium px-3 py-2.5">Scenario</th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "font-medium px-3 py-2.5 cursor-pointer select-none hover:text-foreground",
                      c.align === "right" ? "text-right" : "text-left"
                    )}
                    onClick={() => toggleSort(c.key)}
                  >
                    <span className={cn("inline-flex items-center gap-0.5", c.align === "right" && "flex-row-reverse")}>
                      {c.label}
                      {sortKey === c.key && (sortDir === "asc" ? <IconChevronUp className="size-3" /> : <IconChevronDown className="size-3" />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr
                  key={r.simulation_id}
                  className="border-b border-border/20 hover:bg-muted/20 cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-5 py-2.5 font-mono font-semibold">#{r.simulation_id}</td>
                  <td className="px-3 py-2.5">
                    <Badge className="text-[9px] font-bold px-1.5 py-0 bg-muted/80 text-muted-foreground border-transparent">
                      {r.scenario_type}
                    </Badge>
                    {r.ruin && (
                      <Badge className="text-[9px] font-bold px-1.5 py-0 ml-1 bg-destructive/10 text-destructive border border-destructive/25">
                        RUIN
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.simulation_rank}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono font-bold", signClass(r.ending_return))}>
                    {fmtSigned(r.ending_return * 100)}%
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(r.sharpe))}>{fmtNum(r.sharpe)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-destructive">{fmtPct(r.max_drawdown)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                    {r.recovery_steps != null ? `${r.recovery_steps} steps` : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-muted-foreground">{r.trade_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} simulations
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="cursor-pointer">
              Previous
            </Button>
            <span className="text-xs text-muted-foreground font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="cursor-pointer">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Simulation detail drawer — stats only, never replay (Monte Carlo != Replay) */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[480px] p-0 flex flex-col h-full overflow-hidden">
          {selected && (
            <>
              <SheetHeader className="p-6 pb-4 border-b shrink-0 bg-muted/10">
                <SheetTitle className="text-2xl font-bold tracking-tight">Simulation #{selected.simulation_id}</SheetTitle>
                <SheetDescription>
                  {selected.scenario_type} · Rank {selected.simulation_rank} · P{selected.ending_percentile.toFixed(0)}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-6 flex flex-col gap-5">
                  {selectedCurve && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Equity Curve</p>
                      <div className="h-[100px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={selectedCurve} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                            <XAxis dataKey="step" hide />
                            <YAxis hide domain={["auto", "auto"]} />
                            <Line type="monotone" dataKey="equity" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <StatCell label="Ending Return" value={`${fmtSigned(selected.ending_return * 100)}%`} valueClass={signClass(selected.ending_return)} />
                    <StatCell label="Ending Equity" value={fmtNum(selected.ending_equity, 0)} />
                    <StatCell label="Max Drawdown" value={fmtPct(selected.max_drawdown)} valueClass="text-destructive" />
                    <StatCell label="Sharpe" value={fmtNum(selected.sharpe)} valueClass={signClass(selected.sharpe)} />
                    <StatCell label="Sortino" value={fmtNum(selected.sortino)} valueClass={signClass(selected.sortino)} />
                    <StatCell label="Calmar" value={fmtNum(selected.calmar)} />
                    <StatCell label="Omega" value={fmtNum(selected.omega)} />
                    <StatCell label="Profit Factor" value={fmtNum(selected.profit_factor)} />
                    <StatCell label="Expectancy" value={fmtNum(selected.expectancy, 1)} />
                    <StatCell label="Win Rate" value={fmtPct(selected.win_rate * 100)} />
                    <StatCell label="Avg Trade" value={fmtNum(selected.avg_trade, 1)} />
                    <StatCell label="Best Trade" value={fmtNum(selected.best_trade, 1)} valueClass="text-success" />
                    <StatCell label="Worst Trade" value={fmtNum(selected.worst_trade, 1)} valueClass="text-destructive" />
                    <StatCell label="Longest Win Streak" value={String(selected.longest_win_streak)} />
                    <StatCell label="Longest Loss Streak" value={String(selected.longest_loss_streak)} />
                    <StatCell label="Recovery" value={selected.recovery_steps != null ? `${selected.recovery_steps} steps` : "Never"} />
                    <StatCell label="Trade Count" value={String(selected.trade_count)} />
                    <StatCell label="Ruin" value={selected.ruin ? "Yes" : "No"} valueClass={selected.ruin ? "text-destructive" : "text-success"} />
                    <StatCell label="Seed" value={selected.seed != null ? String(selected.seed) : "—"} />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Scenario Parameters</p>
                    <pre className="text-[11px] font-mono bg-muted/30 rounded-lg p-3 overflow-x-auto text-muted-foreground">
                      {JSON.stringify(JSON.parse(selected.scenario_parameters || "{}"), null, 2)}
                    </pre>
                  </div>

                  <p className="text-[10px] text-muted-foreground/60 font-mono break-all">hash: {selected.scenario_hash}</p>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
