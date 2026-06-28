"use client";

import React, { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconDownload, IconSearch } from "@tabler/icons-react";
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
  quantity: number;
  leverage: number;
  position_value: number;
  entry_price: number;
  exit_price: number;
  gross_pnl: number;
  fees: TradeFees;
  execution_cost: number;
  funding_cost: number;
  net_pnl: number;
  return_pct: number;
  equity_after: number;
  exit_reason: ExitReason;
  entry_reason: EntryReason | null;
  advanced_metrics: AdvancedMetrics;
}

// Formatters
const formatTimestamp = (ts: number) => {
  const date = new Date(ts);
  return date.toISOString().replace("T", " ").substring(0, 16) + " UTC";
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

const formatCurrency = (val: number, maxDecimals = 2) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(val);
};

// CSV Export
const exportCSV = (trades: TradeReport[]) => {
  const headers = [
    "Trade ID", "Trade #", "Symbol", "Side", "Status", 
    "Entry Time (UTC)", "Exit Time (UTC)", "Duration (ms)", 
    "Entry Price", "Exit Price", "Quantity", "Position Value", 
    "Leverage", "Gross PnL", "Entry Fee", "Exit Fee", "Execution Cost",
    "Funding Cost", "Net PnL", "Return %", "Equity After", "Exit Reason"
  ];
  
  const rows = trades.map(t => [
    t.id, t.trade_number, t.symbol, t.side, t.net_pnl > 0 ? "Winner" : t.net_pnl < 0 ? "Loser" : "Breakeven",
    formatTimestamp(t.entry_time), formatTimestamp(t.exit_time), t.duration_ms,
    t.entry_price, t.exit_price, t.quantity, t.position_value,
    t.leverage, t.gross_pnl, t.fees.entry, t.fees.exit, t.execution_cost,
    t.funding_cost, t.net_pnl, t.return_pct, t.equity_after, t.exit_reason.label
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "trade_analysis_report.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getBadgeVariant = (reasonCode: string) => {
  switch (reasonCode) {
    case "take_profit": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
    case "stop_loss": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    case "liquidation": return "bg-red-900/20 text-red-600 hover:bg-red-900/30 font-bold border border-red-500/30";
    case "risk_close_all": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
    case "order_close": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "trailing_stop": return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
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
        <Button variant="outline" size="sm" onClick={() => exportCSV(mappedTrades)} className="gap-2">
          <IconDownload className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Virtualized Table Container */}
      <div 
        ref={parentRef} 
        className="rounded-md border bg-card overflow-auto h-[600px] w-full"
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
          {/* Header Row */}
          <div className="sticky top-0 z-10 grid grid-cols-[80px_100px_80px_140px_140px_100px_120px_120px_100px_120px_80px_120px_100px_120px_100px_140px] gap-2 border-b bg-muted/80 backdrop-blur-sm p-3 text-xs font-medium text-muted-foreground uppercase min-w-max h-12 items-center shadow-sm">
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
                className="absolute top-0 left-0 w-full min-w-max grid grid-cols-[80px_100px_80px_140px_140px_100px_120px_120px_100px_120px_80px_120px_100px_120px_100px_140px] gap-2 p-3 text-sm border-b border-border/5 hover:bg-muted/30 cursor-pointer items-center h-14 transition-colors"
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
                <div className="text-xs font-mono">{formatDuration(t.duration_ms)}</div>
                <div className="text-right font-mono">${formatCurrency(t.entry_price)}</div>
                <div className="text-right font-mono">${formatCurrency(t.exit_price)}</div>
                <div className="text-right font-mono">{t.quantity.toFixed(4)}</div>
                <div className="text-right font-mono text-muted-foreground">${formatCurrency(t.position_value)}</div>
                <div className="text-center font-mono text-xs">{t.leverage}x</div>
                <div className="text-right font-mono">${formatCurrency(t.gross_pnl)}</div>
                <div className="text-right font-mono text-red-500/70">-${formatCurrency(t.execution_cost + t.funding_cost)}</div>
                <div className={cn("text-right font-mono font-medium", isWinner ? "text-emerald-500" : "text-destructive")}>
                  {isWinner ? '+' : ''}${formatCurrency(t.net_pnl)}
                </div>
                <div className={cn("text-right font-mono font-medium", isWinner ? "text-emerald-500" : "text-destructive")}>
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
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedTrade && (
            <>
              <SheetHeader className="mb-6">
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

              <div className="space-y-6">
                <section>
                  <h3 className="font-semibold mb-3">Overview</h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                    <DetailItem label="Status" value={selectedTrade.net_pnl > 0 ? "Winner" : selectedTrade.net_pnl < 0 ? "Loser" : "Breakeven"} color={selectedTrade.net_pnl > 0 ? "text-emerald-500" : selectedTrade.net_pnl < 0 ? "text-destructive" : ""} />
                    <DetailItem label="Duration" value={formatDuration(selectedTrade.duration_ms)} />
                    <DetailItem label="Entry Time" value={formatTimestamp(selectedTrade.entry_time)} className="col-span-2" />
                    <DetailItem label="Exit Time" value={formatTimestamp(selectedTrade.exit_time)} className="col-span-2" />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3">Execution</h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                    <DetailItem label="Entry Price" value={`$${formatCurrency(selectedTrade.entry_price)}`} />
                    <DetailItem label="Exit Price" value={`$${formatCurrency(selectedTrade.exit_price)}`} />
                    <DetailItem label="Quantity" value={`${selectedTrade.quantity.toFixed(4)} ${selectedTrade.symbol.replace("USD", "")}`} />
                    <DetailItem label="Leverage" value={`${selectedTrade.leverage}x`} />
                    <DetailItem label="Entry Notional" value={`$${formatCurrency(selectedTrade.position_value)}`} className="col-span-2" />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3">Financials</h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                    <DetailItem label="Gross PnL" value={`$${formatCurrency(selectedTrade.gross_pnl)}`} color={selectedTrade.gross_pnl > 0 ? "text-emerald-500" : "text-destructive"} />
                    <DetailItem label="Return %" value={`${selectedTrade.return_pct > 0 ? '+' : ''}${selectedTrade.return_pct.toFixed(2)}%`} color={selectedTrade.return_pct > 0 ? "text-emerald-500" : "text-destructive"} />
                    <div className="col-span-2 pt-3 border-t">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Execution</span>
                    </div>
                    <DetailItem label="Entry Fee" value={`-$${formatCurrency(selectedTrade.fees.entry)}`} />
                    <DetailItem label="Exit Fee" value={`-$${formatCurrency(selectedTrade.fees.exit)}`} />
                    <DetailItem label="Execution Cost" value={`-$${formatCurrency(selectedTrade.execution_cost)}`} color="text-red-500" className="col-span-2" />
                    <div className="col-span-2 pt-3 border-t">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Funding</span>
                    </div>
                    <DetailItem label={selectedTrade.funding_cost < 0 ? "Funding Credit" : "Funding Cost"} value={`${selectedTrade.funding_cost <= 0 ? '+' : '-'}$${formatCurrency(Math.abs(selectedTrade.funding_cost))}`} color={selectedTrade.funding_cost <= 0 ? "text-emerald-500" : "text-red-500"} className="col-span-2" />
                    <DetailItem label="Net PnL" value={`${selectedTrade.net_pnl > 0 ? '+' : ''}$${formatCurrency(selectedTrade.net_pnl)}`} color={selectedTrade.net_pnl > 0 ? "text-emerald-500" : "text-destructive"} className="col-span-2 text-xl font-bold" borderTop />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3">Portfolio</h3>
                  <div className="grid grid-cols-1 gap-4 bg-muted/20 p-4 rounded-lg border">
                    <DetailItem label="Portfolio Equity After Trade" value={`$${formatCurrency(selectedTrade.equity_after)}`} className="text-lg font-bold" />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3">Risk & Future Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border">
                    <div className="col-span-2 flex justify-between items-center pb-2 border-b">
                      <span className="text-sm text-muted-foreground">Exit Reason</span>
                      <div className="flex gap-2">
                        {selectedTrade.entry_reason && (
                           <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                             Entry Node: {selectedTrade.entry_reason.action_node}
                           </Badge>
                        )}
                        <Badge className={getBadgeVariant(selectedTrade.exit_reason.code)} variant="outline">
                          {selectedTrade.exit_reason.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <DetailItem label="MAE" value={selectedTrade.advanced_metrics.mae ?? "—"} subtext="Requires future implementation" />
                    <DetailItem label="MFE" value={selectedTrade.advanced_metrics.mfe ?? "—"} subtext="Requires future implementation" />
                    <DetailItem label="R-Multiple" value={selectedTrade.advanced_metrics.r_multiple ?? "—"} subtext="Requires future implementation" />
                    <DetailItem label="Slippage (USDT)" value={selectedTrade.advanced_metrics.slippage ?? "—"} subtext="Requires future implementation" />
                  </div>
                </section>
              </div>
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
