import type { IndicatorDefinition } from "./types";

// 0-100 bounded oscillator — never plotted on the price scale.
export const RSI: IndicatorDefinition = {
  type: "RSI",
  label: "RSI",
  scale: "oscillator",
  decimals: 2,
};
