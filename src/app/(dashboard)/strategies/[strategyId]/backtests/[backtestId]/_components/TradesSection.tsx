"use client";

import React from "react";
import { IconFileSpreadsheet, IconReceipt } from "@tabler/icons-react";
import { TradeAnalysisTable } from "@/components/backtest/TradeAnalysisTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { RuntimeEvent } from "@/types/replay";

interface TradesSectionProps {
  trades: any[];
  orders?: any[];
  events?: RuntimeEvent[];
}

export function TradesSection({
  trades,
  orders = [],
  events = [],
}: TradesSectionProps) {
  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      <Tabs defaultValue="trades" className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/10">
          <TabsList className="h-8 bg-muted/20">
            <TabsTrigger value="trades" className="text-xs px-3 py-1 font-semibold">
              <IconFileSpreadsheet className="size-3.5 mr-2" />
              Completed Trades
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs px-3 py-1 font-semibold">
              <IconReceipt className="size-3.5 mr-2" />
              Orders Lifecycle
            </TabsTrigger>
          </TabsList>

          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-3">
            <span>{trades.length} Trades</span>
            <span className="text-border">•</span>
            <span>{orders.length} Orders</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">

          {/* Trades Sub-tab */}
          <TabsContent value="trades" className="mt-0">
            {trades.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-[13px] text-muted-foreground italic">
                No trades executed in this backtest.
              </div>
            ) : (
              <TradeAnalysisTable trades={trades} events={events} />
            )}
          </TabsContent>

          {/* Orders Sub-tab */}
          <TabsContent value="orders" className="mt-0">
            {orders.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-[13px] text-muted-foreground italic">
                No orders recorded.
              </div>
            ) : (
              <ScrollArea className="h-[400px] border border-border/40 rounded-xl overflow-hidden">
                <table className="w-full border-collapse font-mono text-[12px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40 text-[10px] text-muted-foreground uppercase text-left">
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Symbol</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Side</th>
                      <th className="py-2.5 px-4 text-right">Qty</th>
                      <th className="py-2.5 px-4 text-right">Price</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any, idx) => {
                      const timeStr = new Date(o.timestamp || o.created_at).toLocaleTimeString();
                      const status = o.status || "FILLED";
                      const isRejected = status === "REJECTED";
                      return (
                        <tr key={idx} className={cn("border-b border-border/30 hover:bg-muted/10", isRejected && "bg-destructive/5")}>
                          <td className="py-2 px-4 text-muted-foreground">{timeStr}</td>
                          <td className="py-2 px-4 font-semibold text-foreground">{o.symbol}</td>
                          <td className="py-2 px-4 uppercase">{o.order_type || o.type || "MARKET"}</td>
                          <td className={cn("py-2 px-4 font-bold uppercase", (o.side || "").toLowerCase() === "buy" ? "text-success" : "text-destructive")}>
                            {o.side}
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums">{(o.size || o.quantity || o.amount || 0).toFixed(2)}</td>
                          <td className="py-2 px-4 text-right tabular-nums">${(o.price || o.average_price || 0).toFixed(2)}</td>
                          <td className="py-2 px-4">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", isRejected ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-success/10 text-success border border-success/20")}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
