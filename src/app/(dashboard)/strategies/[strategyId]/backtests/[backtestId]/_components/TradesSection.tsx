"use client";

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
import { IconFileSpreadsheet, IconReceipt, IconSearch, IconChevronUp, IconChevronDown, IconSelector, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { TradeAnalysisTable } from "@/components/backtest/TradeAnalysisTable";
import { CoinLogo } from "@/components/shared/coin-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RuntimeEvent } from "@/types/replay";
import type { OrderRecord, CompletedTrade } from "@/types/backtest";

interface TradesSectionProps {
  trades: CompletedTrade[];
  orders?: OrderRecord[];
  events?: RuntimeEvent[];
}

const columnHelper = createColumnHelper<OrderRecord>();

function OrdersTanstackTable({ orders }: { orders: OrderRecord[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("timestamp", {
        header: "Time",
        cell: (info) => {
          const ts = info.getValue();
          return ts ? (
            <span className="font-mono text-[12px] text-muted-foreground">
              {new Date(ts).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
          ) : (
            "—"
          );
        },
      }),
      columnHelper.accessor("symbol_id", {
        header: "Symbol",
        cell: (info) => {
          const sym = info.getValue() || (info.row.original as any).symbol || "BTCUSD";
          return (
            <span className="flex items-center gap-2 font-semibold">
              <CoinLogo symbol={sym} size={16} />
              <span className="font-mono text-xs">{sym}</span>
            </span>
          );
        },
      }),
      columnHelper.accessor((row) => (row.fill_price && row.fill_price > 0 ? "LIMIT" : "MARKET"), {
        id: "type",
        header: "Type",
        cell: (info) => (
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted/20 border-border/50 text-muted-foreground">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("side", {
        header: "Side",
        cell: (info) => {
          const raw = String(info.getValue() || "").toUpperCase();
          const isBuy = raw.includes("BUY") || raw.includes("LONG");
          return (
            <Badge className={cn("text-[10.5px] font-bold px-2 py-0.5 uppercase tracking-wider", isBuy ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30")}>
              {isBuy ? "BUY" : "SELL"}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("quantity", {
        header: "Qty",
        cell: (info) => {
          const q = info.getValue() || info.row.original.filled_quantity || 0;
          return <span className="font-mono tabular-nums font-medium text-right block">{q > 0 ? q.toFixed(4) : "—"}</span>;
        },
      }),
      columnHelper.accessor((row) => (row.fill_price && row.fill_price > 0 ? row.fill_price : row.price), {
        id: "price",
        header: "Price",
        cell: (info) => {
          const p = info.getValue();
          return (
            <span className="font-mono tabular-nums font-medium text-foreground text-right block">
              {p > 0 ? `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "Market"}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const st = (info.getValue() || "FILLED").toUpperCase();
          const isFilled = st === "FILLED";
          const isRejected = st === "REJECTED" || st === "CANCELLED";
          return (
            <span className={cn("px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider inline-flex items-center gap-1", isRejected ? "bg-destructive/10 text-destructive border border-destructive/20" : isFilled ? "bg-success/10 text-success border border-success/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20")}>
              {st}
            </span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: orders,
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
    <div className="space-y-3">
      {/* Search & Filter Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-64">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search order symbol or status..."
            className="pl-8 text-xs h-9 bg-background/50"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
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
                  No orders match your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
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

      {/* Pagination Controls */}
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
              of <strong className="text-foreground font-semibold">{table.getFilteredRowModel().rows.length}</strong> orders
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
    </div>
  );
}

export function TradesSection({
  trades,
  orders = [],
  events = [],
}: TradesSectionProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Table 1: Completed Trades ── */}
      <div className="rounded-xl bg-card border border-border/60 overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconFileSpreadsheet className="size-4 text-emerald-500" />
            <h3 className="text-[14px] font-bold text-foreground tracking-wide">Completed Trades</h3>
          </div>
          <div className="text-[12px] font-mono text-muted-foreground">
            <strong className="text-foreground">{trades.length}</strong> Trades
          </div>
        </div>

        <div className="p-4">
          {trades.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-[13px] text-muted-foreground italic">
              No trades executed in this backtest.
            </div>
          ) : (
            <TradeAnalysisTable trades={trades} events={events} />
          )}
        </div>
      </div>

      {/* ── Table 2: Orders Lifecycle ── */}
      <div className="rounded-xl bg-card border border-border/60 overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <IconReceipt className="size-4 text-indigo-500" />
            <h3 className="text-[14px] font-bold text-foreground tracking-wide">Orders Lifecycle</h3>
          </div>
          <div className="text-[12px] font-mono text-muted-foreground">
            <strong className="text-foreground">{orders.length}</strong> Orders
          </div>
        </div>

        <div className="p-4">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-[13px] text-muted-foreground italic">
              No orders recorded.
            </div>
          ) : (
            <OrdersTanstackTable orders={orders} />
          )}
        </div>
      </div>
    </div>
  );
}
