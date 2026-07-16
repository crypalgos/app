import type { IndicatorDefinition } from "./types";

// A volatility measure in price units, but not a price level itself — plotting
// it on the candle scale would distort the axis, so it stays oscillator-side.
export const ATR: IndicatorDefinition = {
  type: "ATR",
  label: "ATR",
  scale: "oscillator",
  decimals: 2,
};
