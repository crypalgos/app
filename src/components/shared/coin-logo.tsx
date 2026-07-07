"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getCoinLogoUrl } from "@/lib/instruments";

/** "BTCUSD" -> "BTC", "ETH/USDT" -> "ETH" */
export function baseAsset(symbol: string): string {
  return symbol.replace(/[/-]/g, "").replace(/USDT?$/i, "").toUpperCase();
}

export function CoinLogo({ symbol, size = 20, className }: { symbol: string; size?: number; className?: string }) {
  const asset = baseAsset(symbol);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote CDN icons, next/image needs remotePatterns config
    <img
      src={getCoinLogoUrl(asset.toLowerCase())}
      alt={asset}
      width={size}
      height={size}
      className={cn("rounded-full shrink-0", className)}
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${asset}&size=${size * 2}`;
      }}
    />
  );
}

export function SymbolChip({ symbol, size = 16 }: { symbol: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
      <CoinLogo symbol={symbol} size={size} />
      {symbol}
    </span>
  );
}
