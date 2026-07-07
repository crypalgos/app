// Moved to src/components/shared/report-primitives.tsx so non-backtest report
// pages (Monte Carlo, optimization, walkforward) can reuse the same
// formatting helpers and layout primitives without duplicating them.
// Re-exported here so existing imports in this route keep working unchanged.
export {
  CoinLogo,
  SymbolChip,
  baseAsset,
  fmtUsd,
  fmtPct,
  fmtNum,
  fmtSigned,
  signClass,
  fmtDuration,
  StatCell,
  ReportSectionLabel,
  ReportCard,
} from "@/components/shared/report-primitives";
