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
  /** The real strategy's own ending return / max drawdown — honest plain
   * arithmetic on already-fetched curve data (see page.tsx), used for the
   * drawer's "Compare With Original" section. Only these two metrics are
   * compared; Sharpe/Trades/Expectancy for the real strategy aren't
   * computed anywhere in this dataset and are never fabricated. */
  realDistributionValues: { endingReturn: number; maxDrawdown: number } | null;
}

const PAGE_SIZE = 15;
const RANK_FILTERS = ["all", "top10", "top50", "bottom10", "bottom50"] as const;
type RankFilter = (typeof RANK_FILTERS)[number];
const RANK_FILTER_LABELS: Record<RankFilter, string> = {
  all: "All", top10: "Top 10", top50: "Top 50", bottom10: "Bottom 10", bottom50: "Bottom 50",
};

type SortKey = "simulation_rank" | "ending_percentile" | "ending_return" | "sharpe" | "sortino" | "max_drawdown" | "recovery_steps" | "trade_count" | "seed";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "simulation_rank", label: "Rank" },
  { key: "ending_percentile", label: "Pctl", align: "right" },
  { key: "ending_return", label: "Return", align: "right" },
  { key: "sharpe", label: "Sharpe", align: "right" },
  { key: "sortino", label: "Sortino", align: "right" },
  { key: "max_drawdown", label: "Max DD", align: "right" },
  { key: "recovery_steps", label: "Recovery", align: "right" },
  { key: "trade_count", label: "Trades", align: "right" },
  { key: "seed", label: "Seed", align: "right" },
];

/** "Top X%" — fraction of simulations at least as good as `value` on this
 * metric. higherIsBetter=false for metrics like drawdown where LOWER wins. */
function computeTopPercent(rows: SimulationSummaryRow[], value: number, key: "ending_return" | "sharpe" | "max_drawdown", higherIsBetter: boolean): number | null {
  const values = rows.map((r) => r[key]).filter((v): v is number => Number.isFinite(v));
  if (values.length === 0) return null;
  const betterOrEqual = higherIsBetter ? values.filter((v) => v >= value).length : values.filter((v) => v <= value).length;
  return (betterOrEqual / values.length) * 100;
}

export function SimulationExplorerTable({ rows, samplePaths, realDistributionValues }: SimulationExplorerTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("simulation_rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [scenarioFilter, setScenarioFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<SimulationSummaryRow | null>(null);

  const scenarioTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.scenario_type))).sort(), [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (scenarioFilter) result = result.filter((r) => r.scenario_type === scenarioFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) => String(r.simulation_id).includes(q) || r.scenario_type.toLowerCase().includes(q) || String(r.seed ?? "").includes(q)
      );
    }
    if (rankFilter !== "all") {
      const byRank = [...result].sort((a, b) => a.simulation_rank - b.simulation_rank);
      if (rankFilter === "top10") result = byRank.slice(0, 10);
      else if (rankFilter === "top50") result = byRank.slice(0, 50);
      else if (rankFilter === "bottom10") result = byRank.slice(-10);
      else if (rankFilter === "bottom50") result = byRank.slice(-50);
    }
    return result;
  }, [rows, search, rankFilter, scenarioFilter]);

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

  const distributionPosition = useMemo(() => {
    if (!selected) return null;
    return {
      return: computeTopPercent(rows, selected.ending_return, "ending_return", true),
      sharpe: computeTopPercent(rows, selected.sharpe, "sharpe", true),
      drawdown: computeTopPercent(rows, selected.max_drawdown, "max_drawdown", false),
    };
  }, [selected, rows]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="relative w-64">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search simulation, scenario, seed..."
              className="pl-8"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">{filtered.length.toLocaleString()} / {rows.length.toLocaleString()} simulations</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border border-border/40">
            {RANK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setRankFilter(f); setPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-150 whitespace-nowrap",
                  rankFilter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {RANK_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          {scenarioTypes.length > 1 && (
            <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border border-border/40">
              <button
                onClick={() => { setScenarioFilter(null); setPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-150",
                  scenarioFilter === null ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Scenarios
              </button>
              {scenarioTypes.map((s) => (
                <button
                  key={s}
                  onClick={() => { setScenarioFilter(s); setPage(1); }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all duration-150 whitespace-nowrap",
                    scenarioFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
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
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">P{r.ending_percentile.toFixed(0)}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono font-bold", signClass(r.ending_return))}>
                    {fmtSigned(r.ending_return * 100)}%
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(r.sharpe))}>{fmtNum(r.sharpe)}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(r.sortino))}>{fmtNum(r.sortino)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-destructive">{fmtPct(r.max_drawdown)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                    {r.recovery_steps != null ? `${r.recovery_steps} steps` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{r.trade_count}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-muted-foreground">{r.seed ?? "—"}</td>
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
                  {selected.scenario_type} · Rank #{selected.simulation_rank}
                  {distributionPosition?.return != null && ` · Top ${distributionPosition.return.toFixed(distributionPosition.return < 1 ? 1 : 0)}% Return`}
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

                  {distributionPosition && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Distribution Position</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ["Return", distributionPosition.return],
                          ["Sharpe", distributionPosition.sharpe],
                          ["Drawdown", distributionPosition.drawdown],
                        ] as [string, number | null][]).map(([label, pct]) => (
                          <div key={label} className="rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2 text-center">
                            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className="text-[13px] font-bold font-mono text-foreground mt-0.5">
                              {pct != null ? `Top ${pct.toFixed(pct < 1 ? 1 : 0)}%` : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {realDistributionValues && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Compare With Original</p>
                      <div className="flex flex-col gap-2">
                        {([
                          ["Return", realDistributionValues.endingReturn, selected.ending_return * 100, "%"],
                          ["Drawdown", realDistributionValues.maxDrawdown, selected.max_drawdown, "%"],
                        ] as [string, number, number, string][]).map(([label, original, sim, suffix]) => {
                          const diff = sim - original;
                          return (
                            <div key={label} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-[11px]">
                              <span className="text-muted-foreground">{label}</span>
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-muted-foreground">{fmtSigned(original)}{suffix}</span>
                                <span className="text-muted-foreground/40">→</span>
                                <span className="font-semibold text-foreground">{fmtSigned(sim)}{suffix}</span>
                                <span className={cn("font-semibold", diff >= 0 ? "text-success" : "text-destructive")}>
                                  ({fmtSigned(diff)}{suffix})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-muted-foreground/50 mt-1.5">Sharpe/Trades/Expectancy comparisons need the real strategy&apos;s own per-trade metrics, not tracked in this dataset.</p>
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
                    <StatCell label="Tail Ratio" value={fmtNum(selected.tail_ratio)} />
                    <StatCell label="Expectancy" value={fmtNum(selected.expectancy, 1)} />
                    <StatCell label="Win Rate" value={fmtPct(selected.win_rate * 100)} />
                    <StatCell label="Avg Trade" value={fmtNum(selected.avg_trade, 1)} />
                    <StatCell label="Best Trade" value={fmtNum(selected.best_trade, 1)} valueClass="text-success" />
                    <StatCell label="Worst Trade" value={fmtNum(selected.worst_trade, 1)} valueClass="text-destructive" />
                    <StatCell label="Longest Win Streak" value={String(selected.longest_win_streak)} />
                    <StatCell label="Longest Loss Streak" value={String(selected.longest_loss_streak)} />
                    <StatCell label="Recovery Time" value={selected.recovery_steps != null ? `${selected.recovery_steps} steps` : "Never"} />
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
