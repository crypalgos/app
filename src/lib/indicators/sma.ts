import type { IndicatorDefinition } from "./types";

function computeSMA(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0) return out;

  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= period) sum -= closes[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export const SMA: IndicatorDefinition = {
  type: "SMA",
  label: "SMA",
  scale: "price",
  lineWidth: 2,
  decimals: 2,
  compute: computeSMA,
};
