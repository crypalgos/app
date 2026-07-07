// Moved to src/components/shared/metric-card.tsx so non-backtest report pages
// (Monte Carlo, optimization, walkforward) can reuse the same KPI card
// language without duplicating it. Re-exported here so existing imports in
// this route keep working unchanged.
export { formatCurrencyValue, MetricCard, MetricRow, SectionCard } from "@/components/shared/metric-card";
