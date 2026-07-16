// Assigned by first-seen order (not hashed) so two indicators can never
// collide on the same color just because their key strings happen to hash
// into the same bucket — distinctness only degrades gracefully once a run
// has more indicators than palette entries, at which point colors repeat.
export const INDICATOR_PALETTE = [
  "#818cf8", // indigo
  "#f472b6", // pink
  "#38bdf8", // sky
  "#facc15", // yellow
  "#a78bfa", // violet
  "#4ade80", // green
  "#fb923c", // orange
  "#22d3ee", // cyan
];

/** Builds a stable key -> color map: `overrides[key]` wins, otherwise the
 * palette is assigned in the order `keysInOrder` lists them. */
export function buildIndicatorColorMap(
  keysInOrder: string[],
  overrides: Record<string, string> = {}
): Record<string, string> {
  const map: Record<string, string> = {};
  keysInOrder.forEach((key, i) => {
    map[key] = overrides[key] ?? INDICATOR_PALETTE[i % INDICATOR_PALETTE.length];
  });
  return map;
}
