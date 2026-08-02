const METRIC_LABELS: Record<string, string> = {
  net_profit: "Net Profit",
  sharpe_ratio: "Sharpe Ratio",
  sortino_ratio: "Sortino Ratio",
  calmar_ratio: "Calmar Ratio",
  profit_factor: "Profit Factor",
  max_drawdown: "Max Drawdown",
  win_rate: "Win Rate",
  expectancy: "Expectancy",
  average_trade: "Avg Trade",
  recovery_factor: "Recovery Factor",
};

/** "sharpe_ratio" -> "Sharpe Ratio"; falls back to a title-cased snake_case split for anything unmapped. */
export function formatMetricLabel(metric?: string | null): string {
  if (!metric) return "—";
  return METRIC_LABELS[metric] ?? metric.split("_").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

const PARAM_ABBREVIATIONS = new Set(["ema", "sma", "rsi", "sl", "tp", "atr", "macd", "bb", "adx", "obv", "cci", "vwap"]);
const PARAM_GENERIC_SUFFIXES = new Set(["period", "value", "offset", "threshold", "length", "window"]);

function humanizeParamWord(word: string): string {
  const lower = word.toLowerCase();
  if (PARAM_ABBREVIATIONS.has(lower)) return lower.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Compiler-generated parameter keys are dotted paths like
 * "indicator.ind-ema.ema-fast.period" or "action.act-buy.sizing.value" --
 * far too long/technical for a compact card chip. Pull out the one segment
 * that actually identifies the swept parameter and humanize it:
 * "indicator.ind-ema.ema-fast.period" -> "EMA Fast".
 */
export function formatParamKey(key: string): string {
  const parts = key.split(".");
  let core = parts[parts.length - 1] || key;
  if (PARAM_GENERIC_SUFFIXES.has(core.toLowerCase()) && parts.length >= 2) {
    core = parts[parts.length - 2];
  }
  return core.split(/[-_]/).map(humanizeParamWord).join(" ");
}
