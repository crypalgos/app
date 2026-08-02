"use client";

import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconChevronsLeft,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsRight,
  IconChartAreaLine,
  IconTargetArrow,
  IconGitCompare,
  IconReceipt,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";
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

  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
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

  const parsedParams = useMemo(() => {
    if (!selected?.scenario_parameters) return null;
    try {
      const obj = JSON.parse(selected.scenario_parameters);
      return Object.keys(obj).length > 0 ? obj : null;
    } catch {
      return null;
    }
  }, [selected]);

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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <span className="text-[13px] text-muted-foreground font-mono">{filtered.length.toLocaleString()} / {rows.length.toLocaleString()} simulations</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border border-border/40">
            {RANK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setRankFilter(f); setPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-all duration-150 whitespace-nowrap",
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
                  "px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-all duration-150",
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
                    "px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-all duration-150 whitespace-nowrap",
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
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground border-b border-border/40">
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
                    <Badge className="text-[10.5px] font-bold px-1.5 py-0 bg-muted/80 text-muted-foreground border-transparent">
                      {r.scenario_type}
                    </Badge>
                    {r.drawdown_ruin && (
                      <Badge className="text-[10.5px] font-bold px-1.5 py-0 ml-1 bg-destructive/10 text-destructive border border-destructive/25">
                        DD RUIN
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
                    {r.recovery_steps != null ? (
                      `${r.recovery_steps} steps`
                    ) : (
                      <span className="text-[11px] text-amber-500/90 font-mono font-medium">Unrecovered</span>
                    )}
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-mono">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} simulations
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-card border border-border/40 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-foreground outline-none"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            <IconChevronsLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <IconChevronLeft className="size-3.5" />
          </Button>

          {/* Page pills */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3 && currentPage < totalPages - 1) {
                  pNum = currentPage - 2 + i;
                } else if (currentPage >= totalPages - 1) {
                  pNum = totalPages - 4 + i;
                }
              }
              const isActive = pNum === currentPage;
              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={cn(
                    "size-7 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {pNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            <IconChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
          >
            <IconChevronsRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Simulation detail drawer — matching backtest sheet drawer design */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[420px] sm:w-[540px] p-0 flex flex-col h-full overflow-hidden border-l border-border/60 shadow-2xl">
          {selected && (
            <>
              {/* Header block with Hero Metric & Badges */}
              <SheetHeader className="p-6 pb-5 border-b border-border/40 shrink-0 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold bg-background/80">
                      Simulation #{selected.simulation_id}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {selected.scenario_type}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-mono">
                      Rank #{selected.simulation_rank}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">
                      Ending Return
                    </div>
                    <div className={cn("text-3xl font-extrabold font-mono tracking-tight", selected.ending_return >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {fmtSigned(selected.ending_return * 100)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">
                      Ending Equity
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground">
                      ${fmtNum(selected.ending_equity, 0)}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 w-full min-h-0">
                <div className="p-6 flex flex-col gap-6">
                  {/* Section 1: Equity Curve Mini Chart */}
                  {selectedCurve && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                        <IconChartAreaLine className="size-4 text-primary" />
                        <span>Simulation Equity Curve</span>
                      </div>
                      <div className="h-[120px] rounded-xl border border-border/50 bg-muted/20 p-2 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={selectedCurve} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                            <XAxis dataKey="step" hide />
                            <YAxis hide domain={["auto", "auto"]} />
                            <Line type="monotone" dataKey="equity" stroke="var(--primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  )}

                  {/* Section 2: Distribution Position */}
                  {distributionPosition && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                        <IconTargetArrow className="size-4 text-amber-500" />
                        <span>Distribution Position</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {([
                          ["Return", distributionPosition.return],
                          ["Sharpe", distributionPosition.sharpe],
                          ["Drawdown", distributionPosition.drawdown],
                        ] as [string, number | null][]).map(([label, pct]) => (
                          <div key={label} className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                            <p className="text-xs font-medium text-muted-foreground">{label}</p>
                            <p className="text-base font-extrabold font-mono text-foreground mt-1">
                              {pct != null ? `Top ${pct.toFixed(pct < 1 ? 1 : 0)}%` : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Section 3: Compare With Original */}
                  {realDistributionValues && (
                    <section className="space-y-2.5">
                      <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                        <IconGitCompare className="size-4 text-sky-500" />
                        <span>Compare With Original</span>
                      </div>
                      <div className="flex flex-col gap-2 bg-muted/20 border border-border/40 rounded-xl p-2.5">
                        {([
                          ["Return", realDistributionValues.endingReturn, selected.ending_return * 100, "%"],
                          ["Drawdown", realDistributionValues.maxDrawdown, selected.max_drawdown, "%"],
                        ] as [string, number, number, string][]).map(([label, original, sim, suffix]) => {
                          const diff = sim - original;
                          return (
                            <div key={label} className="flex items-center justify-between rounded-lg bg-card/60 border border-border/30 px-3 py-2 text-xs">
                              <span className="font-medium text-muted-foreground">{label}</span>
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-muted-foreground">{fmtSigned(original)}{suffix}</span>
                                <span className="text-muted-foreground/40">→</span>
                                <span className="font-bold text-foreground">{fmtSigned(sim)}{suffix}</span>
                                <span className={cn("font-bold", diff >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                  ({fmtSigned(diff)}{suffix})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 px-1">
                        Sharpe, trade count, and expectancy comparisons require per-trade logs from original strategy run.
                      </p>
                    </section>
                  )}

                  {/* Section 4: Performance Ledger */}
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                      <IconReceipt className="size-4 text-emerald-500" />
                      <span>Performance Metrics</span>
                    </div>

                    <div className="bg-card border border-border/50 rounded-xl p-4 divide-y divide-border/40 text-xs">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 pb-3">
                        <StatCell label="Max Drawdown" value={fmtPct(selected.max_drawdown)} valueClass="text-rose-500 font-bold" />
                        <StatCell label="Sharpe Ratio" value={fmtNum(selected.sharpe)} valueClass={signClass(selected.sharpe)} />
                        <StatCell label="Sortino Ratio" value={fmtNum(selected.sortino)} valueClass={signClass(selected.sortino)} />
                        <StatCell label="Calmar Ratio" value={fmtNum(selected.calmar)} />
                        <StatCell label="Profit Factor" value={fmtNum(selected.profit_factor)} />
                        <StatCell label="Omega Ratio" value={fmtNum(selected.omega)} />
                        <StatCell label="Tail Ratio" value={fmtNum(selected.tail_ratio)} />
                        <StatCell label="Expectancy" value={fmtNum(selected.expectancy, 1)} />
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 pt-3.5 pb-3">
                        <StatCell label="Win Rate" value={fmtPct(selected.win_rate * 100)} />
                        <StatCell label="Avg Trade" value={fmtNum(selected.avg_trade, 1)} />
                        <StatCell label="Best Trade" value={fmtNum(selected.best_trade, 1)} valueClass="text-emerald-500 font-bold" />
                        <StatCell label="Worst Trade" value={fmtNum(selected.worst_trade, 1)} valueClass="text-rose-500 font-bold" />
                        <StatCell label="Win Streak" value={String(selected.longest_win_streak)} />
                        <StatCell label="Loss Streak" value={String(selected.longest_loss_streak)} />
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 pt-3.5">
                        <StatCell label="Trade Count" value={String(selected.trade_count)} />
                        <StatCell
                          label="Recovery Time"
                          value={selected.recovery_steps != null ? `${selected.recovery_steps} steps` : "Unrecovered"}
                          valueClass={selected.recovery_steps != null ? "" : "text-amber-500 font-semibold"}
                        />
                        <StatCell label="Drawdown Ruin" value={selected.drawdown_ruin ? "Yes" : "No"} valueClass={selected.drawdown_ruin ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"} />
                        <StatCell label="Random Seed" value={selected.seed != null ? String(selected.seed) : "—"} />
                      </div>
                    </div>
                  </section>

                  {/* Section 5: Scenario Parameters & Metadata */}
                  <section className="space-y-2.5">
                    <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
                      <IconAdjustmentsHorizontal className="size-4 text-purple-500" />
                      <span>Scenario Configuration</span>
                    </div>

                    {parsedParams ? (
                      <div className="grid grid-cols-2 gap-2 bg-muted/20 border border-border/40 rounded-xl p-3">
                        {Object.entries(parsedParams).map(([k, v]) => (
                          <div key={k} className="bg-card/70 border border-border/30 rounded-lg p-2 text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium block truncate">
                              {k.replace(/_/g, " ")}
                            </span>
                            <span className="font-mono font-bold text-foreground">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted/20 border border-border/40 rounded-xl p-3.5 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Scenario Method</span>
                          <Badge variant="outline" className="font-mono text-xs font-semibold">
                            {selected.scenario_type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Random Seed</span>
                          <span className="font-mono font-bold text-foreground">{selected.seed ?? "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Simulation Rank</span>
                          <span className="font-mono font-bold text-foreground">#{selected.simulation_rank} (P{selected.ending_percentile.toFixed(0)})</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border/30">
                          <span className="text-muted-foreground">Scenario Hash</span>
                          <span className="font-mono text-[10.5px] text-muted-foreground/80">{selected.scenario_hash.slice(0, 16)}...</span>
                        </div>
                      </div>
                    )}
                  </section>

                  <p className="text-[10.5px] text-muted-foreground/50 font-mono break-all pt-1">
                    hash: {selected.scenario_hash}
                  </p>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
