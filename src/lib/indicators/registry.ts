import type { IndicatorDefinition } from "./types";
import { EMA } from "./ema";
import { SMA } from "./sma";
import { WMA } from "./wma";
import { VWMA } from "./vwma";
import { VWAP } from "./vwap";
import { RSI } from "./rsi";
import { MACD } from "./macd";
import { ATR } from "./atr";

// Add a new indicator by creating its own file next to these and listing it
// here — nothing else in the replay UI needs to change.
const REGISTRY: Record<string, IndicatorDefinition> = Object.fromEntries(
  [EMA, SMA, WMA, VWMA, VWAP, RSI, MACD, ATR].map((def) => [def.type, def])
);

/** Unregistered indicator types default to "oscillator" (side panel only) —
 * never guess an unknown indicator's units are price-compatible, since
 * plotting the wrong scale on the candle axis silently distorts it. */
const DEFAULT_DEFINITION: Omit<IndicatorDefinition, "type"> = {
  scale: "oscillator",
  decimals: 4,
};

export function getIndicatorDefinition(type: string): IndicatorDefinition {
  return REGISTRY[type] ?? { type, ...DEFAULT_DEFINITION };
}

export function isPriceScaleIndicator(type: string): boolean {
  return getIndicatorDefinition(type).scale === "price";
}
