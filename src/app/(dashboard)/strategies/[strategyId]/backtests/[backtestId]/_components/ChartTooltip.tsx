// Moved to src/components/shared/chart-tooltip.tsx so non-backtest report
// pages (Monte Carlo, optimization, walkforward) can reuse the same tooltip.
// Re-exported here so existing imports in this route keep working unchanged.
export { ChartTooltip } from "@/components/shared/chart-tooltip";
