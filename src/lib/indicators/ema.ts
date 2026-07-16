import type { IndicatorDefinition } from "./types";

function computeEMA(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period) return out;

  const multiplier = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += closes[i];
  let prev = seed / period;
  out[period - 1] = prev;

  for (let i = period; i < closes.length; i++) {
    prev = closes[i] * multiplier + prev * (1 - multiplier);
    out[i] = prev;
  }
  return out;
}

export const EMA: IndicatorDefinition = {
  type: "EMA",
  label: "EMA",
  scale: "price",
  lineWidth: 2,
  decimals: 2,
  compute: computeEMA,
};
