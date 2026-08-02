"use client";

import React, { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSearch, IconChevronUp, IconChevronDown, IconTrophy, IconListNumbers } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { StatCell, fmtPct, fmtNum, signClass, fmtUsd } from "@/components/shared/report-primitives";
import { formatParamKey } from "@/components/backtest/metric-format";
import type { OptimizationLeaderboardEntry } from "@/types/optimization";

const PAGE_SIZE = 15;

const MEDAL_CLASS: Record<number, string> = {
  1: "text-amber-500 dark:text-amber-400",
  2: "text-slate-400 dark:text-slate-300",
  3: "text-orange-600 dark:text-orange-400",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className="inline-flex items-center gap-1 font-mono font-bold">
        <IconTrophy className={cn("size-3.5", MEDAL_CLASS[rank])} />
        <span className={MEDAL_CLASS[rank]}>#{rank}</span>
      </span>
    );
  }
  return <span className="font-mono font-bold text-foreground/70">#{rank}</span>;
}

type SortKey = "rank" | "sharpe_ratio" | "sortino_ratio" | "net_profit" | "max_drawdown" | "win_rate" | "total_trades" | "profit_factor";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "rank", label: "Rank" },
  { key: "sharpe_ratio", label: "Sharpe" },
  { key: "sortino_ratio", label: "Sortino" },
  { key: "net_profit", label: "Net Profit" },
  { key: "max_drawdown", label: "Max DD" },
  { key: "win_rate", label: "Win Rate" },
  { key: "total_trades", label: "Trades" },
  { key: "profit_factor", label: "PF" },
];

export function LeaderboardExplorerTable({ rows }: { rows: OptimizationLeaderboardEntry[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<OptimizationLeaderboardEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      Object.entries(r.parameters).some(
        ([k, v]) => `${k}=${v}`.toLowerCase().includes(q) || `${formatParamKey(k)}=${v}`.toLowerCase().includes(q)
      )
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
      setSortDir(key === "rank" ? "asc" : "desc");
    }
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <IconListNumbers className="size-3.5 text-violet-500 dark:text-violet-400" />
          </div>
          <div className="relative w-64">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search parameters..."
              className="pl-8"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filtered.length.toLocaleString()} / {rows.length.toLocaleString()} runs
        </span>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground bg-muted/[0.04] border-b border-border/40">
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="text-right font-medium px-3 py-2.5 cursor-pointer select-none hover:text-foreground first:text-left"
                    onClick={() => toggleSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-0.5 flex-row-reverse first:flex-row">
                      {c.label}
                      {sortKey === c.key && (sortDir === "asc" ? <IconChevronUp className="size-3" /> : <IconChevronDown className="size-3" />)}
                    </span>
                  </th>
                ))}
                <th className="text-left font-medium px-3 py-2.5">Parameters</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr
                  key={r.rank}
                  className={cn("border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors", r.rank === 1 && "bg-amber-500/[0.04]")}
                  onClick={() => setSelected(r)}
                >
                  <td className="px-3 py-2.5 text-left"><RankBadge rank={r.rank} /></td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(r.sharpe_ratio))}>{fmtNum(r.sharpe_ratio)}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", signClass(r.sortino_ratio))}>{fmtNum(r.sortino_ratio)}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", signClass(r.net_profit))}>{fmtUsd(r.net_profit, 0)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-destructive">{fmtPct(r.max_drawdown, 1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmtPct(r.win_rate, 1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{r.total_trades}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{fmtNum(r.profit_factor)}</td>
                  <td className="px-3 py-2.5 text-left font-mono text-[11.5px] text-muted-foreground">
                    {Object.entries(r.parameters).map(([k, v]) => `${formatParamKey(k)}=${v}`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground font-mono">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} runs
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-[13px] text-muted-foreground font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[400px] sm:w-[480px] p-0 flex flex-col h-full overflow-hidden">
          {selected && (
            <>
              <SheetHeader className="p-6 pb-4 border-b shrink-0 bg-muted/10">
                <SheetTitle className="text-2xl font-bold tracking-tight">Rank #{selected.rank}</SheetTitle>
                <SheetDescription>
                  {Object.entries(selected.parameters).map(([k, v]) => `${formatParamKey(k)}=${v}`).join(", ")}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 w-full min-h-0">
                <div className="p-6 flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <StatCell label="Net Profit" value={fmtUsd(selected.net_profit, 0)} valueClass={signClass(selected.net_profit)} />
                    <StatCell label="Return" value={fmtPct(selected.profit_pct)} valueClass={signClass(selected.profit_pct)} />
                    <StatCell label="Sharpe" value={fmtNum(selected.sharpe_ratio)} valueClass={signClass(selected.sharpe_ratio)} />
                    <StatCell label="Sortino" value={fmtNum(selected.sortino_ratio)} valueClass={signClass(selected.sortino_ratio)} />
                    <StatCell label="Calmar" value={fmtNum(selected.calmar_ratio)} />
                    <StatCell label="Max Drawdown" value={fmtPct(selected.max_drawdown)} valueClass="text-destructive" />
                    <StatCell label="Win Rate" value={fmtPct(selected.win_rate, 1)} />
                    <StatCell label="Profit Factor" value={fmtNum(selected.profit_factor)} />
                    <StatCell label="Total Trades" value={String(selected.total_trades)} />
                    <StatCell label="Expectancy" value={fmtUsd(selected.expectancy)} />
                    <StatCell label="Average Trade" value={fmtUsd(selected.average_trade)} />
                    <StatCell label="Recovery Factor" value={fmtNum(selected.recovery_factor)} />
                    <StatCell label="Final Balance" value={fmtUsd(selected.final_balance, 0)} />
                  </div>

                  <div>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Parameters</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selected.parameters).map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2">
                          <span className="text-[11px] text-muted-foreground block truncate" title={k}>{formatParamKey(k)}</span>
                          <span className="text-base font-mono font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Badge className="bg-muted/60 text-muted-foreground border-transparent text-[11px]">
                      Research Notes and Run Again/Replay actions are a follow-up item — not wired yet
                    </Badge>
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
