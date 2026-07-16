/** One file per indicator type under this directory — add a new indicator by
 * dropping in a definition here and registering it in registry.ts, nowhere
 * else needs to change. */
export interface IndicatorDefinition {
  /** Matches IndicatorValueRecord.type from the backend (e.g. "EMA"). */
  type: string;
  /** Human label prefix, e.g. "EMA" -> "EMA 9". Defaults to `type` if omitted. */
  label?: string;
  /** "price" overlays on the candle price scale; "oscillator" stays in the
   * side legend/panel only — never squashed onto a price axis it doesn't share units with. */
  scale: "price" | "oscillator";
  /** lightweight-charts line width for price-scale overlays. */
  lineWidth?: 1 | 2 | 3 | 4;
  /** Decimal places for the formatted value. */
  decimals?: number;
  /** Client-side recompute from raw closes — enables the "change length"
   * control in the replay chart. Only defined for indicators with a simple,
   * well-known formula (moving averages); omitted for anything the client
   * can't faithfully reproduce (VWAP needs volume + session anchoring, so it
   * doesn't get one here). `closes[i]` corresponds 1:1 with the candle at
   * that index in the loaded window — the first `period - 1` entries are
   * `null` (not enough lookback within the window to seed the average). */
  compute?: (closes: number[], period: number) => (number | null)[];
}
