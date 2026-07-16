import type { IndicatorDefinition } from "./types";

// Unbounded oscillator, different units than price — side panel only.
export const MACD: IndicatorDefinition = {
  type: "MACD",
  label: "MACD",
  scale: "oscillator",
  decimals: 4,
};
