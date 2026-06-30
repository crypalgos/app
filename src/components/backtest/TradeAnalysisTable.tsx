"use client";

import React, { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  IconDownload, 
  IconSearch, 
  IconCalendar, 
  IconClock, 
  IconShield, 
  IconWallet, 
  IconReceipt, 
  IconCoins, 
  IconTrendingUp, 
  IconTrendingDown,
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertCircle
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Types
export interface TradeFees {
  entry: number;
  exit: number;
  funding: number;
}

export interface ExitReason {
  code: string;
  label: string;
  price: number;
  trigger?: string;
  node_id?: string;
  event_id?: string;
  decision_trace_id?: string;
}

export interface EntryReason {
  action_node: string;
  decision_trace_id: string;
  runtime_event_start: number;
  runtime_event_end: number;
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
  exit_reason: ExitReason;
  entry_reason: EntryReason | null;
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

const exportToCSV = (trades: TradeReport[], filename = "trade_report.csv") => {
  const headers = [
    "Trade #", "Symbol", "Side", "Entry Time", "Exit Time", "Duration", "Entry Price", "Exit Price",
    "Quantity", "Leverage", "Gross PnL", "Entry Fee", "Exit Fee", "Execution Cost",
    "Funding Cost", "Net PnL", "Return %", "Equity After", "Exit Reason"
  ];

  const csvRows = [headers.join(",")];

  for (const t of trades) {
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
      `"${t.exit_reason.label}"`
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

const getBadgeVariant = (reasonCode: string) => {
  switch (reasonCode) {
    case "take_profit": return "bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20";
    case "stop_loss": return "bg-rose-500/10 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20";
    case "liquidation": return "bg-red-500/15 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-500/20";
    case "risk_close_all": return "bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20";
    case "strategy_exit": return "bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20";
    case "signal_reversal": return "bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20";
    case "end_of_backtest": return "bg-zinc-500/10 dark:bg-zinc-400/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/20";
    case "trailing_stop": return "bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20";
    default: return "bg-muted text-muted-foreground";
  }
};

export function TradeAnalysisTable({ trades }: { trades: any[] }) {
  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<TradeReport | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

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
        exit_reason: t.exit_reason || { code: "unknown", label: "Unknown", price: 0 },
        entry_reason: t.entry_reason || null,
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

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: filteredTrades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Row height
    overscan: 10,
  });

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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(mappedTrades)} className="gap-2">
          <IconDownload className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Virtualized Table Container */}
      <div 
        ref={parentRef} 
        className="rounded-xl border border-border bg-card overflow-auto h-[600px] w-full"
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
          {/* Header Row */}
          <div className="sticky top-0 z-10 grid grid-cols-[80px_100px_80px_140px_140px_100px_120px_120px_100px_120px_80px_120px_100px_120px_100px_140px] gap-2 border-b border-border bg-muted/65 backdrop-blur-sm p-3 text-xs font-semibold text-muted-foreground uppercase min-w-max h-12 items-center shadow-sm">
            <div>Trade #</div>
            <div>Symbol</div>
            <div>Side</div>
            <div>Entry Time</div>
            <div>Exit Time</div>
            <div>Duration</div>
            <div className="text-right">Entry Price</div>
            <div className="text-right">Exit Price</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Pos Value</div>
            <div className="text-center">Lev</div>
            <div className="text-right">Gross PnL</div>
            <div className="text-right">Fees</div>
            <div className="text-right">Net PnL</div>
            <div className="text-right">Return</div>
            <div>Exit Reason</div>
          </div>

          {/* Virtual Rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const t = filteredTrades[virtualRow.index];
            const isWinner = t.net_pnl > 0;
            return (
              <div
                key={virtualRow.index}
                className="absolute top-0 left-0 w-full min-w-max grid grid-cols-[80px_100px_80px_140px_140px_100px_120px_120px_100px_120px_80px_120px_100px_120px_100px_140px] gap-2 p-3 text-sm border-b border-border/40 hover:bg-muted/10 cursor-pointer items-center h-14 transition-colors"
                style={{ transform: `translateY(${virtualRow.start + 48}px)` }} // +48 for header
                onClick={() => setSelectedTrade(t)}
              >
                <div className="font-mono text-muted-foreground">#{t.trade_number}</div>
                <div className="font-semibold">{t.symbol}</div>
                <div>
                  <Badge variant={t.side === "LONG" ? "default" : "destructive"} className="text-[10px]">
                    {t.side}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{formatTimestamp(t.entry_time)}</div>
                <div className="text-xs text-muted-foreground font-mono">{formatTimestamp(t.exit_time)}</div>
                <div className="text-xs font-mono text-muted-foreground">{formatDuration(t.duration_ms)}</div>
                <div className="text-right font-mono text-foreground">{formatCurrency(t.entry_price)}</div>
                <div className="text-right font-mono text-foreground">{formatCurrency(t.exit_price)}</div>
                <div className="text-right font-mono text-foreground">{t.quantity.toFixed(4)}</div>
                <div className="text-right font-mono text-muted-foreground">${formatCurrency(t.position_value)}</div>
                <div className="text-center font-mono text-xs text-foreground/80">{t.leverage}x</div>
                <div className="text-right font-mono text-foreground">${formatCurrency(t.gross_pnl)}</div>
                <div className="text-right font-mono text-destructive/80">-${formatCurrency(t.execution_cost + t.funding_cost)}</div>
                <div className={cn("text-right font-mono font-semibold", isWinner ? "text-success" : "text-destructive")}>
                  {isWinner ? '+' : ''}${formatCurrency(t.net_pnl)}
                </div>
                <div className={cn("text-right font-mono font-semibold", isWinner ? "text-success" : "text-destructive")}>
                  {isWinner ? '+' : ''}{t.return_pct.toFixed(2)}%
                </div>
                <div>
                  <Badge className={cn("text-[10px] whitespace-nowrap", getBadgeVariant(t.exit_reason.code))} variant="outline">
                    {t.exit_reason.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
                            {selectedTrade.entry_reason && (
                              <Badge variant="outline" className="border-indigo-500/20 text-indigo-500 text-[10px] py-0 px-2 bg-indigo-500/5">
                                Node: {selectedTrade.entry_reason.action_node}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                            ${formatCurrency(selectedTrade.entry_price)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(selectedTrade.entry_time)}
                          </div>
                        </div>
                      </div>

                      {/* Position Details Line */}
                      <div className="py-2.5 px-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 px-1.5">
                            {selectedTrade.side}
                          </Badge>
                          <span>{selectedTrade.quantity.toFixed(4)} {selectedTrade.symbol.replace("USD", "")}</span>
                        </div>
                        <span className="font-semibold text-foreground/80">{selectedTrade.leverage}x Leverage</span>
                      </div>

                      {/* Exit point */}
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 size-3.5 rounded-full bg-purple-500 border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Exit</span>
                            <Badge className={cn("text-[10px] py-0 px-2", getBadgeVariant(selectedTrade.exit_reason.code))} variant="outline">
                              {selectedTrade.exit_reason.label}
                            </Badge>
                          </div>
                          <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                            ${formatCurrency(selectedTrade.exit_price)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(selectedTrade.exit_time)}
                          </div>
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
