"use client";

import { getCoinLogoUrl } from "@/lib/instruments";
import { formatIndicatorLabel, type IndicatorSnapshotRecord, type ReplayCandle } from "@/types/replay";
import { getIndicatorDefinition } from "@/lib/indicators";
import { deriveSession, deriveTrend } from "@/lib/replay-analysis";
import { IconArrowUpRight, IconArrowDownRight, IconGauge, IconEye, IconEyeOff, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface ReplaySymbolPanelProps {
  symbol: string | undefined;
  exchange?: string;
  timeframe?: string;
  leverage?: number;
  /** Identifies the market-price definition shown to the user. */
  priceBasis?: string;
  /** Full loaded window — needed for the Trend heuristic (close vs N bars back). */
  candles: ReplayCandle[];
  currentCandle: ReplayCandle | undefined;
  currentCandleIndex: number | null;
  indicatorsAtBar: IndicatorSnapshotRecord[];
  indicatorColors: Record<string, string>;
  hiddenIndicators: Set<string>;
  onToggleIndicator: (key: string) => void;
  onChangeIndicatorColor: (key: string, color: string) => void;
  /** Length/period overrides — only offered for indicators with a client-side
   * `compute` formula (moving averages); recomputed live from the loaded window. */
  periodOverrides: Record<string, number>;
  onChangePeriod: (key: string, period: number) => void;
}

export function ReplaySymbolPanel({
  symbol,
  exchange,
  timeframe,
  leverage,
  priceBasis,
  candles,
  currentCandle,
  currentCandleIndex,
  indicatorsAtBar,
  indicatorColors,
  hiddenIndicators,
  onToggleIndicator,
  onChangeIndicatorColor,
  periodOverrides,
  onChangePeriod,
}: ReplaySymbolPanelProps) {
  const close = currentCandle?.close ?? null;
  const open = currentCandle?.open ?? null;
  const changePct = close != null && open != null && open !== 0 ? ((close - open) / open) * 100 : null;
  const isUp = (changePct ?? 0) >= 0;
  const trend = currentCandleIndex != null ? deriveTrend(candles, currentCandleIndex) : null;
  const session = currentCandle?.timestamp != null ? deriveSession(currentCandle.timestamp) : null;

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto px-3 py-3">
      {/* Symbol card */}
      <div className="rounded-xl border border-border/60 bg-card px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {symbol && (
            <img
              src={getCoinLogoUrl(symbol.replace(/USD[T]?|PERP/i, ""))}
              alt={symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${symbol}&background=random`;
              }}
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-foreground truncate">{symbol ?? "—"}</span>
            <span className="text-[10px] text-muted-foreground font-mono truncate">{exchange ?? "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {timeframe && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground uppercase">
              {timeframe}
            </span>
          )}
          {leverage != null && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
              {leverage}x
            </span>
          )}
        </div>
      </div>

      {/* Current price */}
      <div className="rounded-xl border border-border/60 bg-card px-3 py-3 flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">Current Price</span>
          {priceBasis && <span className="text-[9px] font-mono text-muted-foreground">{priceBasis}</span>}
        </div>
        {close != null ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tabular-nums text-foreground">
                {close.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              {changePct != null && (
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-[11px] font-bold tabular-nums",
                    isUp ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {isUp ? <IconArrowUpRight className="size-3" /> : <IconArrowDownRight className="size-3" />}
                  {changePct.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
              <OhlcRow label="Open" value={currentCandle?.open} />
              <OhlcRow label="High" value={currentCandle?.high} />
              <OhlcRow label="Low" value={currentCandle?.low} />
              <OhlcRow label="Close" value={currentCandle?.close} />
              {currentCandle?.volume != null && (
                <OhlcRow label="Volume" value={currentCandle.volume} className="col-span-2" />
              )}
            </div>
            {(trend || session) && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/40">
                {trend && (
                  <div className="flex items-center gap-1">
                    {trend === "Up" ? (
                      <IconTrendingUp className="size-3 text-emerald-500" />
                    ) : trend === "Down" ? (
                      <IconTrendingDown className="size-3 text-rose-500" />
                    ) : (
                      <IconMinus className="size-3 text-muted-foreground" />
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">Trend: <span className="text-foreground font-semibold">{trend}</span></span>
                  </div>
                )}
                {session && (
                  <span className="text-[10px] font-mono text-muted-foreground">Session: <span className="text-foreground font-semibold">{session}</span></span>
                )}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No candle at this bar.</span>
        )}
      </div>

      {/* Indicators */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
          <IconGauge className="size-3.5 text-primary" />
          <h3 className="text-[11px] font-semibold text-foreground/80 tracking-wide">Indicators</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {indicatorsAtBar.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No indicator snapshot at this bar.</p>
          ) : (
            // A bar can have more than one INDICATOR_SNAPSHOT record (one per
            // indicator node in the strategy canvas) -- merge their `values`
            // into one map before rendering so the same key never produces
            // two rows/React keys (later snapshot wins per key, same
            // "later duplicates win" convention used elsewhere for merges).
            Object.entries(
              indicatorsAtBar.reduce<Record<string, IndicatorSnapshotRecord["values"][string]>>(
                (merged, snap) => ({ ...merged, ...(snap.values ?? {}) }),
                {}
              )
            ).map(([key, entry]) => {
                const isHidden = hiddenIndicators.has(key);
                const color = indicatorColors[key] ?? "#818cf8";
                const definition = getIndicatorDefinition(entry.type);
                const canChangeLength = !!definition.compute;
                const effectivePeriod = periodOverrides[key] ?? entry.period ?? "";
                return (
                  <div
                    key={`${symbol}-${key}`}
                    className={cn("flex items-center justify-between gap-2 group", isHidden && "opacity-40")}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <label
                        className="relative size-3 rounded-full shrink-0 cursor-pointer ring-1 ring-border/60"
                        style={{ backgroundColor: color }}
                        title="Change color"
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => onChangeIndicatorColor(key, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      {canChangeLength ? (
                        <>
                          <span className="text-[11px] text-muted-foreground truncate">{definition.label ?? entry.type}</span>
                          <input
                            type="number"
                            min={1}
                            value={effectivePeriod}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (v > 0) onChangePeriod(key, v);
                            }}
                            title="Length (recomputed from the loaded window)"
                            className="w-10 h-5 shrink-0 rounded border border-border/60 bg-muted/30 text-[10px] font-mono text-center outline-none focus:border-primary"
                          />
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground truncate">{formatIndicatorLabel(entry)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-semibold text-foreground tabular-nums">
                        {entry.value.toFixed(4)}
                      </span>
                      <button
                        onClick={() => onToggleIndicator(key)}
                        title={isHidden ? "Show on chart" : "Hide from chart"}
                        className="text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isHidden ? <IconEyeOff className="size-3" /> : <IconEye className="size-3" />}
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

function OhlcRow({ label, value, className }: { label: string; value?: number; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-mono font-medium text-foreground tabular-nums">
        {value != null ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
      </span>
    </div>
  );
}
