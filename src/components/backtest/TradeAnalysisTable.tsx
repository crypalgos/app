import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DecisionTraceTimeline } from "./DecisionTraceTimeline";
import { buildTraceIndex, resolveTraceForSequence } from "@/lib/replay";
import { CoinLogo } from "@/components/shared/coin-logo";
import type { CompletedTrade } from "@/types/backtest";
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
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
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

const tradeColumnHelper = createColumnHelper<TradeReport>();

export function TradeAnalysisTable({ trades, events = [] }: { trades: CompletedTrade[], events?: RuntimeEvent[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "trade_number", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<TradeReport | null>(null);

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

  const mappedTrades = useMemo<TradeReport[]>(() => {
    if (!trades || !Array.isArray(trades)) return [];
    
    return trades.map((t: CompletedTrade, index) => {
      const position_value = (t.amount || 0) * (t.entry_price || 0);
      const entry_fee = t.entry_fee || 0;
      const exit_fee = t.exit_fee || 0;
      const funding_cost = t.funding_cost || 0;
      const execution_cost = entry_fee + exit_fee;
      const gross_pnl = t.gross_pnl || 0;
      const net_pnl = t.net_pnl || 0;
      const leverage = t.leverage || 1;
      const margin = position_value / leverage;
      const return_pct = margin > 0 ? (net_pnl / margin) * 100 : 0;
      
      return {
        id: t.trade_id || `trade-${index + 1}`,
        trade_number: index + 1,
        symbol: t.symbol || "BTCUSD",
        side: (String(t.side || "LONG").toUpperCase() === "SHORT" ? "SHORT" : "LONG") as "LONG" | "SHORT",
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

  const columns = useMemo(
    () => [
      tradeColumnHelper.accessor("symbol", {
        header: "Symbol",
        cell: (info) => (
          <span className="flex items-center gap-2 font-semibold">
            <CoinLogo symbol={info.getValue()} size={16} />
            <span className="font-mono text-xs">{info.getValue()}</span>
          </span>
        ),
      }),
      tradeColumnHelper.accessor("side", {
        header: "Side",
        cell: (info) => {
          const side = info.getValue();
          return (
            <Badge
              className={cn(
                "text-[10.5px] font-bold px-1.5 py-0 uppercase tracking-wider",
                side === "LONG"
                  ? "bg-success/10 text-success border border-success/25"
                  : "bg-destructive/10 text-destructive border border-destructive/25"
              )}
            >
              {side}
            </Badge>
          );
        },
      }),
      tradeColumnHelper.accessor("entry_time", {
        header: "Opened",
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground">{formatTimestamp(info.getValue())}</span>
        ),
      }),
      tradeColumnHelper.accessor("entry_price", {
        header: "Entry",
        cell: (info) => (
          <span className="font-mono text-xs text-right block">{formatCurrency(info.getValue())}</span>
        ),
      }),
      tradeColumnHelper.accessor("exit_price", {
        header: "Exit",
        cell: (info) => (
          <span className="font-mono text-xs text-right block">{formatCurrency(info.getValue())}</span>
        ),
      }),
      tradeColumnHelper.accessor("quantity", {
        header: "Qty",
        cell: (info) => (
          <span className="font-mono text-xs text-right block">{info.getValue().toFixed(4)}</span>
        ),
      }),
      tradeColumnHelper.accessor("duration_ms", {
        header: "Duration",
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground text-right block">
            {formatDuration(info.getValue())}
          </span>
        ),
      }),
      tradeColumnHelper.accessor("net_pnl", {
        header: "PnL",
        cell: (info) => {
          const pnl = info.getValue();
          const isWin = pnl > 0;
          return (
            <span
              className={cn(
                "font-mono text-xs font-bold text-right block tabular-nums",
                isWin ? "text-success" : "text-destructive"
              )}
            >
              {isWin ? "+" : ""}${formatCurrency(pnl)}
            </span>
          );
        },
      }),
      tradeColumnHelper.accessor((row) => (row.net_pnl > 0 ? "WIN" : "LOSS"), {
        id: "result",
        header: "Result",
        cell: (info) => {
          const res = info.getValue();
          return (
            <Badge
              className={cn(
                "text-[10.5px] font-bold px-1.5 py-0 uppercase tracking-wider ml-auto block w-fit",
                res === "WIN"
                  ? "bg-success/10 text-success border border-success/25"
                  : "bg-destructive/10 text-destructive border border-destructive/25"
              )}
            >
              {res}
            </Badge>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: mappedTrades,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-64">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search symbol..."
            className="pl-8 text-xs h-9 bg-background/50"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(mappedTrades, traceIndex)} className="gap-2 text-xs h-9 cursor-pointer">
          <IconDownload className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* TanStack + Shadcn Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card/50 shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/40">
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "text-[11px] uppercase tracking-wider text-muted-foreground font-semibold py-2.5 px-4 h-9",
                        isSortable && "cursor-pointer select-none hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 justify-start">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && (
                          <span className="size-3 text-muted-foreground/60">
                            {sorted === "asc" ? (
                              <IconChevronUp className="size-3" />
                            ) : sorted === "desc" ? (
                              <IconChevronDown className="size-3" />
                            ) : (
                              <IconSelector className="size-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-border/20 text-[13px]">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground italic text-xs">
                  No trades match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedTrade(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between pt-2 flex-wrap gap-3 text-xs">
          {/* Left: Metadata info & page size switcher */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-mono text-[12px]">
              Showing <strong className="text-foreground font-semibold">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</strong>–
              <strong className="text-foreground font-semibold">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </strong>{" "}
              of <strong className="text-foreground font-semibold">{table.getFilteredRowModel().rows.length}</strong> trades
            </span>

            <div className="flex items-center gap-1.5 border-l border-border/40 pl-3">
              <span className="text-[11px] text-muted-foreground font-medium">Rows:</span>
              <div className="inline-flex items-center p-0.5 rounded-md bg-muted/60 border border-border/50">
                {[10, 25, 50].map((pageSize) => (
                  <button
                    key={pageSize}
                    onClick={() => table.setPageSize(pageSize)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer select-none",
                      table.getState().pagination.pageSize === pageSize
                        ? "bg-card text-primary shadow-2xs border border-border/60"
                        : "text-muted-foreground/80 hover:text-foreground"
                    )}
                  >
                    {pageSize}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Icon Pagination Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="size-8 cursor-pointer border-border/60"
              title="First Page"
            >
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="size-8 cursor-pointer border-border/60"
              title="Previous Page"
            >
              <IconChevronLeft className="size-4" />
            </Button>

            {/* Page number pills */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                let pageNum = i;
                const totalPages = table.getPageCount();
                const curr = table.getState().pagination.pageIndex;
                if (totalPages > 5) {
                  if (curr > 2 && curr < totalPages - 2) {
                    pageNum = curr - 2 + i;
                  } else if (curr >= totalPages - 2) {
                    pageNum = totalPages - 5 + i;
                  }
                }
                const isActive = curr === pageNum;

                return (
                  <button
                    key={pageNum}
                    onClick={() => table.setPageIndex(pageNum)}
                    className={cn(
                      "size-8 rounded-md text-[11.5px] font-mono font-bold transition-all cursor-pointer select-none",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-extrabold"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="size-8 cursor-pointer border-border/60"
              title="Next Page"
            >
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="size-8 cursor-pointer border-border/60"
              title="Last Page"
            >
              <IconChevronsRight className="size-4" />
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
                      <span className="text-[11px] font-bold tracking-wider uppercase opacity-70">Net Profit / Loss</span>
                      <span className="text-2xl font-extrabold font-mono tracking-tight tabular-nums">
                        {selectedTrade.net_pnl > 0 ? "+" : ""}${formatCurrency(selectedTrade.net_pnl)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={cn(
                        "text-[13px] font-bold font-mono py-0.5 px-2.5",
                        selectedTrade.net_pnl > 0 
                          ? "bg-success/10 text-success border border-success/20" 
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      )} variant="outline">
                        {selectedTrade.return_pct > 0 ? "+" : ""}{selectedTrade.return_pct.toFixed(2)}% Return
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase">
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
                            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Entry</span>
                            {selectedEntryTrace?.triggered_action && (
                              <Badge variant="outline" className="border-indigo-500/20 text-indigo-500 text-[11px] py-0 px-2 bg-indigo-500/5">
                                {selectedEntryTrace.triggered_action}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                            ${formatCurrency(selectedTrade.entry_price)}
                          </div>
                          <div className="text-[13px] text-muted-foreground font-mono">
                            {formatTimestamp(selectedTrade.entry_time)}
                          </div>

                          {hasEventData && selectedTrade.entry_sequence != null && (
                            <DecisionTraceTimeline trace={selectedEntryTrace} />
                          )}
                        </div>
                      </div>

                      {/* Position Details Line */}
                      <div className="py-2.5 px-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between text-[13px] font-mono text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px] font-bold uppercase py-0 px-1.5">
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
                            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Exit</span>
                            {hasEventData && selectedExitTrace?.triggered_action && (
                              <Badge className={cn("text-[11px] py-0 px-2", getBadgeVariant(selectedExitTrace.triggered_action))} variant="outline">
                                {selectedExitTrace.triggered_action}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold font-mono tracking-tight text-foreground">
                            ${formatCurrency(selectedTrade.exit_price)}
                          </div>
                          <div className="text-[13px] text-muted-foreground font-mono">
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
                            <span className="text-[11px] text-muted-foreground/60 font-mono">Taker Commission</span>
                          </div>
                          <span className="font-mono text-destructive/90">-${formatCurrency(selectedTrade.fees.entry)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">Exit Execution Fee</span>
                            <span className="text-[11px] text-muted-foreground/60 font-mono">Taker Commission</span>
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
                          <span className="text-[11px] text-muted-foreground/60">Interest rate paid/received</span>
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
      <span className="text-[13px] text-muted-foreground mb-1">{label}</span>
      <span className={cn("font-mono font-medium", color)}>{value}</span>
      {subtext && <span className="text-[11px] text-muted-foreground/60 mt-0.5">{subtext}</span>}
    </div>
  );
}
