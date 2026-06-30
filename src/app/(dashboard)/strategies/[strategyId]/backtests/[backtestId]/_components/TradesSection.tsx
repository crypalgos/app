"use client";

import React from "react";
import { IconFileSpreadsheet } from "@tabler/icons-react";
import { TradeAnalysisTable } from "@/components/backtest/TradeAnalysisTable";

interface TradesSectionProps {
  trades: any[];
}

export function TradesSection({ trades }: TradesSectionProps) {
  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <IconFileSpreadsheet className="size-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold text-foreground/85 tracking-wide">
            Trade Log
          </h3>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {trades.length} trades
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-[180px] text-[13px] text-muted-foreground">
            No trades executed
          </div>
        ) : (
          <TradeAnalysisTable trades={trades} />
        )}
      </div>
    </div>
  );
}
