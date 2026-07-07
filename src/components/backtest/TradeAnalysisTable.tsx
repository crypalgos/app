"use client";

import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DecisionTraceTimeline } from "./DecisionTraceTimeline";
import { buildTraceIndex, resolveTraceForSequence } from "@/lib/replay";
import { CoinLogo } from "@/components/shared/coin-logo";
import type { RuntimeEvent } from "@/types/replay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconDownload,
  IconSearch,
  IconClock,
  IconWallet,
  IconReceipt,
  IconShield,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Types
export interface TradeFees {
  entry: number;
  exit: number;
  funding: number;
}

export interface AdvancedMetrics {
  mae: number | null;
  mfe: number | null;
  r_multiple: number | null;
  slippage: number | null;
}

export interface TradeReport {
  id: string;
  trade_number: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_time: number;
  exit_time: number;
  duration_ms: number;
  entry_price: number;
  exit_price: number;
  quantity: number;
  position_value: number;
  leverage: number;
  gross_pnl: number;
  net_pnl: number;
  return_pct: number;
  execution_cost: number;
  funding_cost: number;
  equity_after: number;
  fees: TradeFees;
  entry_sequence: number | null;
  exit_sequence: number | null;
  advanced_metrics: AdvancedMetrics;
}

const formatCurrency = (val: number) => {
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatTimestamp = (ts: number) => {
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

const exportToCSV = (trades: TradeReport[], traceIndex: ReturnType<typeof buildTraceIndex>, filename = "trade_report.csv") => {
  const headers = [
    "Trade #", "Symbol", "Side", "Entry Time", "Exit Time", "Duration", "Entry Price", "Exit Price",
    "Quantity", "Leverage", "Gross PnL", "Entry Fee", "Exit Fee", "Execution Cost",
    "Funding Cost", "Net PnL", "Return %", "Equity After", "Exit Trigger"
  ];

  const csvRows = [headers.join(",")];

  for (const t of trades) {
    const exitTrace = resolveTraceForSequence(traceIndex, t.exit_sequence);
    const row = [
      t.trade_number,
      t.symbol,
      t.side,
      `"${formatTimestamp(t.entry_time)}"`,
      `"${formatTimestamp(t.exit_time)}"`,
      `"${formatDuration(t.duration_ms)}"`,
      t.entry_price.toFixed(4),
      t.exit_price.toFixed(4),
      t.quantity.toFixed(4),
      t.leverage,
      t.gross_pnl.toFixed(4),
      t.fees.entry.toFixed(4),
      t.fees.exit.toFixed(4),
      t.execution_cost.toFixed(4),
      t.funding_cost.toFixed(4),
      t.net_pnl.toFixed(4),
      t.return_pct.toFixed(4),
      t.equity_after.toFixed(4),
      `"${exitTrace?.triggered_action || ""}"`
    ];
    csvRows.push(row.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Matches against the resolved trace's triggered_action — which is either an
// ExitPolicy.type ("STOP_LOSS" | "TAKE_PROFIT" | "TRAILING_STOP") or an
// action_id/action_type from a compiled/hand-written strategy (e.g. "close_all").
const getBadgeVariant = (trigger: string | null | undefined) => {
  switch ((trigger || "").toUpperCase()) {
    case "TAKE_PROFIT": return "bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20";
    case "STOP_LOSS": return "bg-rose-500/10 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20";
    case "LIQUIDATION": return "bg-red-500/15 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-500/20";
    case "TRAILING_STOP": return "bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20";
    case "CLOSE_ALL": return "bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const PAGE_SIZE = 10;

export function TradeAnalysisTable({ trades, events = [] }: { trades: any[], events?: RuntimeEvent[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<TradeReport | null>(null);

  // Built once from the full event stream — O(1) lookups per trade instead
  // of re-scanning the event stream for every row (see src/lib/replay.ts).
  // The static report page doesn't fetch runtime_events at all, so this is
  // usually empty — the decision-trace drill-down below only appears when a
  // caller actually supplies events (e.g. a future replay view).
  const hasEventData = events.length > 0;
  const traceIndex = useMemo(() => buildTraceIndex(events), [events]);

  const selectedEntryTrace = useMemo(
    () => resolveTraceForSequence(traceIndex, selectedTrade?.entry_sequence),
    [traceIndex, selectedTrade]
  );
  const selectedExitTrace = useMemo(
    () => resolveTraceForSequence(traceIndex, selectedTrade?.exit_sequence),
    [traceIndex, selectedTrade]
  );

  // Map Backend trades to TradeReport
  const mappedTrades = useMemo<TradeReport[]>(() => {
    if (!trades || !Array.isArray(trades)) return [];
    
    return trades.map((t, index) => {
      // Map the backend 'CompletedTrade' to 'TradeReport'
      const position_value = (t.amount || 0) * (t.entry_price || 0);
      const entry_fee = t.entry_fee || 0;
      const exit_fee = t.exit_fee || 0;
      const funding_cost = t.funding_cost || 0;
      const execution_cost = entry_fee + exit_fee;
      const gross_pnl = t.gross_pnl || 0;
      const net_pnl = t.net_pnl ?? (t.pnl || 0);
      const leverage = t.leverage || 1;
      const margin = position_value / leverage;
      const return_pct = margin > 0 ? (net_pnl / margin) * 100 : 0;
      
      return {
        id: t.trade_id || `trade-${index}`,
        trade_number: index + 1,
        symbol: t.symbol || "UNKNOWN",
        side: (t.side || "LONG").toUpperCase() as "LONG" | "SHORT",
        entry_time: t.entry_time || 0,
        exit_time: t.exit_time || 0,
        duration_ms: (t.exit_time || 0) - (t.entry_time || 0),
        quantity: t.amount || 0,
        leverage: leverage,
        position_value: position_value,
        entry_price: t.entry_price || 0,
        exit_price: t.exit_price || 0,
        gross_pnl: gross_pnl,
        fees: {
          entry: entry_fee,
          exit: exit_fee,
          funding: funding_cost,
        },
        execution_cost: execution_cost,
        funding_cost: funding_cost,
        net_pnl: net_pnl,
        return_pct: return_pct,
        equity_after: t.portfolio_equity_after || 0,
        entry_sequence: t.entry_sequence ?? null,
        exit_sequence: t.exit_sequence ?? null,
        advanced_metrics: {
          mae: null,
          mfe: null,
          r_multiple: null,
          slippage: null
        }
      };
    });
  }, [trades]);

  // Sorting & Filtering
  const filteredTrades = useMemo(() => {
    let result = [...mappedTrades];
    if (search) {
      result = result.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()));
    }
    // Reverse chronologically
    return result.sort((a, b) => b.trade_number - a.trade_number);
  }, [mappedTrades, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTrades = useMemo(
    () => filteredTrades.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredTrades, currentPage]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search symbol..." 
            className="pl-8" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(mappedTrades, traceIndex)} className="gap-2">
          <IconDownload className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Paginated Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                <th className="text-left font-medium px-5 py-2.5">Symbol</th>
                <th className="text-left font-medium px-3 py-2.5">Side</th>
                <th className="text-left font-medium px-3 py-2.5">Opened</th>
                <th className="text-right font-medium px-3 py-2.5">Entry</th>
                <th className="text-right font-medium px-3 py-2.5">Exit</th>
                <th className="text-right font-medium px-3 py-2.5">Qty</th>
                <th className="text-right font-medium px-3 py-2.5">Duration</th>
                <th className="text-right font-medium px-3 py-2.5">PnL</th>
                <th className="text-right font-medium px-5 py-2.5">Result</th>
              </tr>
            </thead>
            <tbody>
              {pagedTrades.map((t) => {
                const isWinner = t.net_pnl > 0;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border/20 hover:bg-muted/20 cursor-pointer"
                    onClick={() => setSelectedTrade(t)}
                  >
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-2 font-semibold">
                        <CoinLogo symbol={t.symbol} size={16} />
                        {t.symbol}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0",
                          t.side === "LONG"
                            ? "bg-success/10 text-success border border-success/25"
                            : "bg-destructive/10 text-destructive border border-destructive/25"
                        )}
                      >
                        {t.side}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{formatTimestamp(t.entry_time)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(t.entry_price)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(t.exit_price)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{t.quantity.toFixed(4)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{formatDuration(t.duration_ms)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-mono font-bold", isWinner ? "text-success" : "text-destructive")}>
                      {isWinner ? "+" : ""}
                      {formatCurrency(t.net_pnl)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Badge
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0",
                          isWinner
                            ? "bg-success/10 text-success border border-success/25"
                            : "bg-destructive/10 text-destructive border border-destructive/25"
                        )}
                      >
                        {isWinner ? "WIN" : "LOSS"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTrades.length)} of {filteredTrades.length} trades
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

      {/* Trade Details Drawer */}
      <Sheet open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col h-full overflow-hidden">
          {selectedTrade && (
            <>
              <SheetHeader className="p-6 pb-4 border-b shrink-0 bg-muted/10">
                <div className="flex items-center gap-3">
                  <Badge variant={selectedTrade.side === "LONG" ? "default" : "destructive"}>
                    {selectedTrade.side}
                  </Badge>
                  <SheetTitle className="text-2xl font-bold tracking-tight">
                    {selectedTrade.symbol} <span className="text-muted-foreground font-normal">Trade #{selectedTrade.trade_number}</span>
                  </SheetTitle>
                </div>
                <SheetDescription>
                  Detailed trade analysis and execution logs.
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 w-full min-h-0">
                <div className="space-y-6 p-6 pb-8">
                  {/* Hero Section Banner */}
                  <div className={cn(
                    "p-4 rounded-xl border flex items-center justify-between shadow-sm relative overflow-hidden",
                    selectedTrade.net_pnl > 0 
                      ? "bg-success/5 border-success/20 text-success" 
                      : "bg-destructive/5 border-destructive/20 text-destructive"
                  )}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 p-3 opacity-[0.03] pointer-events-none">
                      {selectedTrade.net_pnl > 0 ? <IconTrendingUp className="size-20" /> : <IconTrendingDown className="size-20" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-70">Net Profit / Loss</span>
                      <span className="text-2xl font-extrabold font-mono tracking-tight tabular-nums">
                        {selectedTrade.net_pnl > 0 ? "+" : ""}${formatCurrency(selectedTrade.net_pnl)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={cn(
                        "text-xs font-bold font-mono py-0.5 px-2.5",
                        selectedTrade.net_pnl > 0 
                          ? "bg-success/10 text-success border border-success/20" 
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      )} variant="outline">
                        {selectedTrade.return_pct > 0 ? "+" : ""}{selectedTrade.return_pct.toFixed(2)}% Return
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                        {selectedTrade.net_pnl > 0 ? "Winner Trade" : "Loser Trade"}
                      </span>
                    </div>
                  </div>

                  {/* Execution timeline */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <IconClock className="size-4 text-indigo-500" />
                      <span>Execution Path</span>
                    </div>
                    
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                      {/* Entry point */}
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 size-3.5 rounded-full bg-indigo-500 border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Entry</span>
                            {selectedEntryTrace?.triggered_action && (
                              <Badge variant="outline" className="border-indigo-500/20 text-indigo-500 text-[10px] py-0 px-2 bg-indigo-500/5">
                                {selectedEntryTrace.triggered_action}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                            ${formatCurrency(selectedTrade.entry_price)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(selectedTrade.entry_time)}
                          </div>

                          {hasEventData && selectedTrade.entry_sequence != null && (
                            <DecisionTraceTimeline trace={selectedEntryTrace} />
                          )}
                        </div>
                      </div>

                      {/* Position Details Line */}
                      <div className="py-2.5 px-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 px-1.5">
                            {selectedTrade.side}
                          </Badge>
                          <span>{selectedTrade.quantity.toFixed(2)} {selectedTrade.symbol.replace("USD", "")}</span>
                        </div>
                        <span className="font-semibold text-foreground/80">{selectedTrade.leverage}x Leverage</span>
                      </div>

                      {/* Exit point */}
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 size-3.5 rounded-full bg-purple-500 border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Exit</span>
                            {hasEventData && selectedExitTrace?.triggered_action && (
                              <Badge className={cn("text-[10px] py-0 px-2", getBadgeVariant(selectedExitTrace.triggered_action))} variant="outline">
                                {selectedExitTrace.triggered_action}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                            ${formatCurrency(selectedTrade.exit_price)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(selectedTrade.exit_time)}
                          </div>

                          {hasEventData && selectedTrade.exit_sequence != null && (
                            <DecisionTraceTimeline trace={selectedExitTrace} />
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Financial Ledger Section */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <IconReceipt className="size-4 text-success" />
                      <span>Financial Ledger</span>
                    </div>
                    
                    <div className="bg-muted/20 border border-border rounded-xl overflow-hidden divide-y divide-border/60">
                      <div className="p-4 flex justify-between items-center bg-muted/10">
                        <span className="text-sm font-medium">Gross Profit / Loss</span>
                        <span className={cn("font-bold font-mono", selectedTrade.gross_pnl > 0 ? "text-success" : "text-destructive")}>
                          ${formatCurrency(selectedTrade.gross_pnl)}
                        </span>
                      </div>

                      <div className="p-4 space-y-3 bg-card">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Entry Execution Fee</span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono">Taker Commission</span>
                          </div>
                          <span className="font-mono text-destructive/90">-${formatCurrency(selectedTrade.fees.entry)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Exit Execution Fee</span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono">Taker Commission</span>
                          </div>
                          <span className="font-mono text-destructive/90">-${formatCurrency(selectedTrade.fees.exit)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-border/60">
                          <span className="font-medium">Total Execution Cost</span>
                          <span className="font-mono text-destructive font-semibold">-${formatCurrency(selectedTrade.execution_cost)}</span>
                        </div>
                      </div>

                      <div className="p-4 flex justify-between items-center bg-card">
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">Financing Cost (Funding)</span>
                          <span className="text-[10px] text-muted-foreground/60">Interest rate paid/received</span>
                        </div>
                        <span className={cn("font-mono font-semibold", selectedTrade.funding_cost <= 0 ? "text-success" : "text-destructive")}>
                          {selectedTrade.funding_cost <= 0 ? "+" : "-"}${formatCurrency(Math.abs(selectedTrade.funding_cost))}
                        </span>
                      </div>

                      <div className="p-4 flex justify-between items-center bg-muted/15">
                        <span className="font-bold text-foreground">Net Position Profit</span>
                        <span className={cn("font-extrabold font-mono text-lg", selectedTrade.net_pnl > 0 ? "text-success" : "text-destructive")}>
                          {selectedTrade.net_pnl > 0 ? "+" : ""}${formatCurrency(selectedTrade.net_pnl)}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Capital Allocation & Capacity */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <IconWallet className="size-4 text-orange-500" />
                      <span>Capital & Leverage</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                      <DetailItem label="Entry Notional" value={`$${formatCurrency(selectedTrade.position_value)}`} />
                      <DetailItem label="Position Leverage" value={`${selectedTrade.leverage}x`} />
                      <DetailItem label="Duration" value={formatDuration(selectedTrade.duration_ms)} className="col-span-2" />
                      <DetailItem label="Portfolio Equity after Close" value={`$${formatCurrency(selectedTrade.equity_after)}`} className="col-span-2 text-foreground font-bold border-t border-dashed pt-3" />
                    </div>
                  </section>

                  {/* Advanced Risk Metrics */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <IconShield className="size-4 text-purple-500" />
                      <span>Advanced Risk Metrics</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                      <DetailItem label="MAE (Max Adverse Excursion)" value={selectedTrade.advanced_metrics.mae ?? "—"} subtext="Adverse price swing during trade" />
                      <DetailItem label="MFE (Max Favorable Excursion)" value={selectedTrade.advanced_metrics.mfe ?? "—"} subtext="Favorable price swing during trade" />
                      <DetailItem label="R-Multiple" value={selectedTrade.advanced_metrics.r_multiple ?? "—"} subtext="Risk-to-reward multiple" />
                      <DetailItem label="Slippage (USDT)" value={selectedTrade.advanced_metrics.slippage ?? "—"} subtext="Execution slippage cost" />
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailItem({ label, value, color, className, borderTop, subtext }: { label: string, value: string | React.ReactNode, color?: string, className?: string, borderTop?: boolean, subtext?: string }) {
  return (
    <div className={cn("flex flex-col", className, borderTop && "pt-3 border-t")}>
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <span className={cn("font-mono font-medium", color)}>{value}</span>
      {subtext && <span className="text-[10px] text-muted-foreground/60 mt-0.5">{subtext}</span>}
    </div>
  );
}
