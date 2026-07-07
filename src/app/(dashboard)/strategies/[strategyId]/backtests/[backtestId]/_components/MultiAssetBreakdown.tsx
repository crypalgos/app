"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconCoins } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getCoinLogoUrl } from "@/lib/instruments";
import type { SymbolMetrics } from "@/types/strategy-actions";

interface MultiAssetBreakdownProps {
  symbols: Record<string, SymbolMetrics>;
}

function getCoinSymbol(sym: string): string {
  if (!sym) return "btc";
  const match = sym.match(/^([a-zA-Z]+)/);
  return match ? match[1].toLowerCase() : "btc";
}

export function MultiAssetBreakdown({ symbols }: MultiAssetBreakdownProps) {
  const entries = Object.entries(symbols);
  if (entries.length <= 1) return null;

  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <IconCoins className="size-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground/85 tracking-wide">
            Multi-Asset Breakdown
          </h3>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {entries.length} assets
        </span>
      </div>

      {/* Table */}
      <ScrollArea className="max-h-[320px]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/30 backdrop-blur-sm">
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-3 px-5">
                Asset
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-4">
                Net Profit
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-4">
                Sharpe
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-4">
                Sortino
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-4">
                Max DD
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-5">
                Recovery
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([sym, stats]: [string, SymbolMetrics], i) => {
              const coinSym = getCoinSymbol(sym);
              const coinLogo = getCoinLogoUrl(coinSym);
              return (
                <tr
                  key={sym}
                  className={cn(
                    "transition-colors hover:bg-muted/20",
                    i < entries.length - 1 && "border-b border-border/40"
                  )}
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-6 flex items-center justify-center rounded-full bg-muted border border-border/40 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coinLogo} alt={sym} className="size-3.5 object-contain" />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground">{sym}</span>
                    </div>
                  </td>
                  <td
                    className={cn(
                      "text-right text-[13px] font-mono font-semibold tabular-nums py-3.5 pr-4",
                      (stats.net_profit ?? 0) >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    ${(stats.net_profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right text-[13px] font-mono font-medium tabular-nums text-foreground/80 py-3.5 pr-4">
                    {(stats.sharpe_ratio ?? 0).toFixed(2)}
                  </td>
                  <td className="text-right text-[13px] font-mono font-medium tabular-nums text-foreground/80 py-3.5 pr-4">
                    {(stats.sortino_ratio ?? 0).toFixed(2)}
                  </td>
                  <td className="text-right text-[13px] font-mono font-medium tabular-nums text-destructive py-3.5 pr-4">
                    {(stats.max_drawdown_pct ?? 0).toFixed(2)}%
                  </td>
                  <td className="text-right text-[13px] font-mono font-medium tabular-nums text-foreground/80 py-3.5 pr-5">
                    {(stats.recovery_factor ?? 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
