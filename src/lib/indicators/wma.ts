import type { IndicatorDefinition } from "./types";

function computeWMA(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period) return out;

  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < closes.length; i++) {
    let weighted = 0;
    for (let w = 0; w < period; w++) weighted += closes[i - period + 1 + w] * (w + 1);
    out[i] = weighted / denom;
  }
  return out;
}

export const WMA: IndicatorDefinition = {
  type: "WMA",
  label: "WMA",
  scale: "price",
  lineWidth: 2,
  decimals: 2,
  compute: computeWMA,
};
