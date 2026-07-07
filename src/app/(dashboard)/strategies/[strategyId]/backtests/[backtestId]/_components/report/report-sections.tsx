"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { AnalyticsReport, BacktestSummary } from "@/types/backtest";
import {
  CoinLogo,
  SymbolChip,
  baseAsset,
  fmtUsd,
  fmtPct,
  fmtNum,
  fmtDuration,
  signClass,
  StatCell,
  ReportSectionLabel,
} from "./report-primitives";

/* eslint-disable @typescript-eslint/no-explicit-any */
type TradeRow = Record<string, any>;
type OrderRow = Record<string, any>;

// ─── Masthead ─────────────────────────────────────────────────────────────────

export function ReportMasthead({
  summary,
  symbols,
  completedAt,
}: {
  summary: BacktestSummary;
  symbols: string[];
  completedAt?: string | null;
}) {
  const period =
    summary.start_date && summary.end_date
      ? `${new Date(summary.start_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })} – ${new Date(summary.end_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
      : null;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Brand gradient strip */}
      <div className="h-1 w-full bg-gradient-to-r from-chart-1 via-chart-3 to-chart-5" />
      <div className="px-6 py-5">
        <div className="flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-muted-foreground/70 font-semibold">
          <span>CrypAlgos Research</span>
          <span className="flex items-center gap-4">
            {completedAt && <span>Generated {new Date(completedAt).toLocaleString()}</span>}
            <span className="text-foreground/60 border border-border/60 rounded px-1.5 py-0.5">Confidential</span>
          </span>
        </div>

        <div className="flex items-end justify-between mt-3 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-foreground">Cryp</span>
              <span className="text-primary">Algos</span>
              <span className="text-muted-foreground font-semibold text-lg ml-3">Strategy Backtest Report</span>
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {period && <span>Period {period}</span>}
              <span className="text-border">·</span>
              <span className="flex items-center gap-2">
                Universe:
                {symbols.map((s) => (
                  <SymbolChip key={s} symbol={s} size={16} />
                ))}
              </span>
              <span className="text-border">·</span>
              <span>Prepared for internal review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Warnings banner ──────────────────────────────────────────────────────────

export function WarningsBanner({ report }: { report: AnalyticsReport }) {
  const warnings = report.warnings ?? [];
  const kelly = report.fractional_kelly as
    | { risk_tier?: string; recommended_fractional_kelly?: number }
    | undefined;

  if (warnings.length === 0 && !kelly?.risk_tier) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        {warnings.map((w) => (
          <span key={w} className="inline-flex items-center gap-1.5 text-xs">
            <Badge className="bg-destructive/10 text-destructive border border-destructive/25 text-[9px] font-bold uppercase px-1.5">
              <IconAlertTriangle className="size-3 mr-0.5" />
              Warning
            </Badge>
            <span className="font-mono font-semibold text-foreground/80">{w.replace(/_/g, " ")}</span>
          </span>
        ))}
        {warnings.length === 0 && <span className="text-xs text-muted-foreground">No audit warnings.</span>}
      </div>
      {kelly?.risk_tier && (
        <span className="text-[11px] text-muted-foreground font-mono">
          Kelly tier: <span className="font-bold text-foreground">{kelly.risk_tier}</span>
          {kelly.recommended_fractional_kelly != null && (
            <> · recommended sizing {(kelly.recommended_fractional_kelly * 100).toFixed(1)}%</>
          )}
        </span>
      )}
    </div>
  );
}

// ─── Per-symbol breakdown cards ──────────────────────────────────────────────

export function SymbolBreakdownCards({
  report,
  trades,
}: {
  report: AnalyticsReport;
  trades: TradeRow[];
}) {
  const symbols = report.metrics?.symbols ?? {};
  const keys = Object.keys(symbols);
  if (keys.length === 0) return null;

  const perSymbolTrades = new Map<string, { wins: number; losses: number; count: number }>();
  for (const t of trades) {
    const s = t.symbol as string;
    const entry = perSymbolTrades.get(s) ?? { wins: 0, losses: 0, count: 0 };
    entry.count += 1;
    if ((t.net_pnl ?? 0) > 0) entry.wins += 1;
    else entry.losses += 1;
    perSymbolTrades.set(s, entry);
  }

  return (
    <div className={cn("grid gap-4", keys.length > 1 ? "md:grid-cols-2" : "grid-cols-1")}>
      {keys.map((sym) => {
        const m = symbols[sym];
        const wl = perSymbolTrades.get(sym) ?? { wins: 0, losses: 0, count: 0 };
        const winPct = wl.count > 0 ? (wl.wins / wl.count) * 100 : 0;
        return (
          <div key={sym} className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-foreground">
                <CoinLogo symbol={sym} size={22} />
                {sym}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">{wl.count} trades</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
              <StatCell label="Net Profit" value={fmtUsd(m.net_profit)} valueClass={signClass(m.net_profit)} />
              <StatCell label="Recovery Factor" value={fmtNum(m.recovery_factor)} valueClass={signClass(m.recovery_factor)} />
              <StatCell
                label="Sharpe / Sortino"
                value={`${fmtNum(m.sharpe_ratio)} / ${fmtNum(m.sortino_ratio)}`}
                valueClass={signClass(m.sharpe_ratio)}
              />
              <StatCell label="Max Drawdown" value={fmtPct(m.max_drawdown_pct)} valueClass="text-destructive" />
            </div>

            {/* win/loss ratio bar */}
            {wl.count > 0 && (
              <div className="mt-4">
                <div className="h-1.5 rounded-full overflow-hidden bg-destructive/60 flex">
                  <div className="h-full bg-success" style={{ width: `${winPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>{wl.wins} wins</span>
                  <span>{wl.losses} losses</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order lifecycle ──────────────────────────────────────────────────────────

export function OrderLifecyclePanel({ orders }: { orders: OrderRow[] }) {
  const counts = useMemo(() => {
    const byStatus = new Map<string, number>();
    for (const o of orders) {
      const s = String(o.status ?? "FILLED").toUpperCase();
      byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
    }
    return byStatus;
  }, [orders]);

  const total = orders.length;
  if (total === 0) return null;

  const filled = counts.get("FILLED") ?? 0;
  const cancelled = counts.get("CANCELLED") ?? counts.get("CANCELED") ?? 0;
  const rejected = counts.get("REJECTED") ?? 0;
  const other = total - filled - cancelled - rejected;

  const rows: { label: string; value: number; barClass: string }[] = [
    { label: "Filled", value: filled, barClass: "bg-success" },
    { label: "Cancelled", value: cancelled, barClass: "bg-muted-foreground/60" },
    { label: "Rejected", value: rejected, barClass: "bg-destructive" },
    ...(other > 0 ? [{ label: "Other", value: other, barClass: "bg-chart-2" }] : []),
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Order Lifecycle</h3>
        <span className="text-[10px] text-muted-foreground font-mono">{total} orders</span>
      </div>
      <div className="flex flex-col gap-2.5 mt-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-[76px] text-[11px] text-muted-foreground shrink-0">{r.label}</span>
            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", r.barClass)} style={{ width: `${(r.value / total) * 100}%` }} />
            </div>
            <span className="w-[90px] text-right text-[11px] font-mono text-foreground shrink-0">
              {r.value} <span className="text-muted-foreground">({((r.value / total) * 100).toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk statistics ──────────────────────────────────────────────────────────

export function RiskStatsPanel({ report }: { report: AnalyticsReport }) {
  const risk = report.metrics?.risk;
  if (!risk) return null;

  const cells: { label: string; value: string; cls?: string }[] = [
    { label: "VaR 95%", value: fmtPct(risk.historical_var_95), cls: signClass(risk.historical_var_95) },
    { label: "VaR 99%", value: fmtPct(risk.historical_var_99), cls: signClass(risk.historical_var_99) },
    { label: "CVaR 95%", value: fmtPct(risk.cvar_95), cls: signClass(risk.cvar_95) },
    { label: "CVaR 99%", value: fmtPct(risk.cvar_99), cls: signClass(risk.cvar_99) },
    { label: "Ulcer Index", value: fmtNum(risk.ulcer_index) },
    { label: "Tail Ratio", value: fmtNum(risk.tail_ratio) },
    { label: "Omega Ratio", value: fmtNum(risk.omega_ratio) },
    { label: "Gain-to-Pain", value: fmtNum(risk.gain_to_pain_ratio), cls: signClass(risk.gain_to_pain_ratio) },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-4">Risk</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-4">
        {cells.map((c) => (
          <StatCell key={c.label} label={c.label} value={c.value} valueClass={c.cls} />
        ))}
      </div>
    </div>
  );
}

// ─── Trade distribution table ─────────────────────────────────────────────────

export function TradeDistributionTable({ report }: { report: AnalyticsReport }) {
  const dists = report.metrics?.distributions ?? {};
  const global = dists.global;
  if (!global) return null;

  const symbolKeys = Object.keys(dists).filter((k) => k !== "global");
  const cols = ["global", ...symbolKeys];

  const money = (v: number | null | undefined) => (
    <span className={signClass(v)}>{fmtUsd(v)}</span>
  );

  const rows: { label: string; render: (d: (typeof global)) => React.ReactNode }[] = [
    { label: "Avg winner / loser", render: (d) => <>{money(d.average_winner)} / {money(d.average_loser)}</> },
    { label: "Median winner / loser", render: (d) => <>{money(d.median_winner)} / {money(d.median_loser)}</> },
    { label: "Largest winner / loser", render: (d) => <>{money(d.largest_winner)} / {money(d.largest_loser)}</> },
    { label: "Payoff ratio", render: (d) => fmtNum(d.payoff_ratio) },
    { label: "Expectancy / trade", render: (d) => money(d.expectancy) },
    { label: "Kelly %", render: (d) => fmtPct(d.kelly_pct != null ? d.kelly_pct * 100 : null, 1) },
    { label: "Max consecutive W / L", render: (d) => `${d.max_consecutive_wins} / ${d.max_consecutive_losses}` },
    {
      label: "Avg / median duration",
      render: (d) => `${fmtNum(d.average_trade_duration_hours, 1)}h / ${fmtNum(d.median_trade_duration_hours, 1)}h`,
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/40">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Trade Distribution</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
              <th className="text-left font-medium px-5 py-2.5">Metric</th>
              {cols.map((c) => (
                <th key={c} className="text-right font-medium px-4 py-2.5">
                  {c === "global" ? "Global" : c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/20 hover:bg-muted/20">
                <td className="px-5 py-2.5 text-muted-foreground">{r.label}</td>
                {cols.map((c) => (
                  <td key={c} className="px-4 py-2.5 text-right font-mono">
                    {dists[c] ? r.render(dists[c]) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Monthly returns strip ────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyReturnsStrip({ report }: { report: AnalyticsReport }) {
  const returns = report.monthly?.returns ?? {};
  const entries = Object.entries(returns);
  if (entries.length === 0) return null;

  // Every year touched by the backtest gets a full Jan-Dec row — a strategy
  // that only ran Nov-Dec 2025 still shows the whole 2025 calendar, with the
  // untouched months left blank rather than omitted.
  const byYear = new Map<string, Map<number, number>>();
  let maxAbs = 0.01;
  for (const [key, value] of entries) {
    const [year, month] = key.split("-");
    const monthIdx = Number(month) - 1;
    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year)!.set(monthIdx, value);
    maxAbs = Math.max(maxAbs, Math.abs(value));
  }
  const years = Array.from(byYear.keys()).sort();

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-4">Monthly Returns</h3>
      <div className="flex flex-col gap-2">
        {years.map((year) => (
          <div key={year} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground w-9 shrink-0">{year}</span>
            <div className="flex gap-1.5 flex-1">
              {MONTH_LABELS.map((label, idx) => {
                const value = byYear.get(year)?.get(idx);
                const hasData = value !== undefined;
                const positive = hasData && value >= 0;
                const intensity = hasData ? Math.min(Math.abs(value) / maxAbs, 1) : 0;
                return (
                  <div
                    key={label}
                    className={cn(
                      "flex-1 flex flex-col items-center rounded-lg px-1.5 py-2 border min-w-0",
                      hasData
                        ? positive ? "border-success/25" : "border-destructive/25"
                        : "border-dashed border-border/30"
                    )}
                    style={
                      hasData
                        ? {
                            backgroundColor: positive
                              ? `color-mix(in oklch, var(--success) ${8 + intensity * 22}%, transparent)`
                              : `color-mix(in oklch, var(--destructive) ${8 + intensity * 22}%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
                    {hasData ? (
                      <span className={cn("text-[11px] font-bold font-mono", positive ? "text-success" : "text-destructive")}>
                        {value! >= 0 ? "+" : ""}
                        {value!.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-muted-foreground/30">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Correlation & concentration ─────────────────────────────────────────────

function correlationCellStyle(corr: number): React.CSSProperties {
  const intensity = Math.min(Math.abs(corr), 1);
  const varName = corr >= 0 ? "--chart-2" : "--destructive";
  return {
    backgroundColor: `color-mix(in oklch, var(${varName}) ${10 + intensity * 55}%, transparent)`,
  };
}

export function CorrelationHeatmap({ report }: { report: AnalyticsReport }) {
  const matrix = report.correlations?.matrix;
  const keys = matrix ? Object.keys(matrix) : [];
  if (!matrix || keys.length < 2) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-4">Correlation Matrix</h3>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-10" />
              {keys.map((k) => (
                <th key={k} className="p-1.5">
                  <div className="flex flex-col items-center gap-1">
                    <CoinLogo symbol={k} size={18} />
                    <span className="text-[9px] font-semibold text-muted-foreground">{baseAsset(k)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((rowKey) => (
              <tr key={rowKey}>
                <th className="p-1.5 text-right pr-2">
                  <span className="flex items-center gap-1.5 justify-end">
                    <span className="text-[9px] font-semibold text-muted-foreground">{baseAsset(rowKey)}</span>
                    <CoinLogo symbol={rowKey} size={18} />
                  </span>
                </th>
                {keys.map((colKey) => {
                  const corr = matrix[rowKey]?.[colKey];
                  if (typeof corr !== "number") return <td key={colKey} className="w-16 h-12" />;
                  return (
                    <td
                      key={colKey}
                      className="w-16 h-12 text-center align-middle rounded-md border border-border/20"
                      style={correlationCellStyle(corr)}
                    >
                      <span className="text-xs font-bold font-mono tabular-nums">{corr.toFixed(2)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConcentrationPanel({ report }: { report: AnalyticsReport }) {
  const conc = report.metrics?.concentration;
  const div = report.metrics?.diversification;
  if (!conc && !div) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-4">Concentration</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        <StatCell label="HHI" value={fmtNum(conc?.hhi_index)} />
        <StatCell
          label="Max symbol weight"
          value={conc?.maximum_symbol_weight != null ? fmtPct(conc.maximum_symbol_weight * 100, 0) : "—"}
        />
        <StatCell label="Effective assets" value={fmtNum(conc?.effective_number_of_assets, 1)} />
        <StatCell label="Diversification ratio" value={fmtNum(div?.diversification_ratio)} />
      </div>
    </div>
  );
}

// ─── Sizing & capacity cards ──────────────────────────────────────────────────

export function SizingCards({ report }: { report: AnalyticsReport }) {
  const cap = report.metrics?.capacity;
  if (!cap) return null;

  const cards = [
    { label: "Avg Position Size", value: fmtUsd(cap.average_position_size) },
    { label: "Max Position Size", value: fmtUsd(cap.maximum_position_size) },
    { label: "Avg Margin Usage", value: fmtPct(cap.average_margin_usage * 100, 1) },
    { label: "Max Margin Usage", value: fmtPct(cap.maximum_margin_usage * 100, 1) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border/60 bg-card px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{c.label}</div>
          <div className="text-lg font-bold font-mono tabular-nums mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function ReportFooter({ report, datasetCount }: { report: AnalyticsReport; datasetCount: number }) {
  const health = (report.dataset_health ?? {}) as { status?: string };
  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono border-t border-border/40 pt-4 pb-2 flex-wrap gap-2">
      <span>
        Dataset health: <span className="text-foreground font-semibold">{health.status ?? "HEALTHY"}</span> ·{" "}
        {datasetCount} datasets registered
      </span>
      <span>Generated by CrypAlgos · backtest engine v{report.schema_version ?? "—"}</span>
    </div>
  );
}

export { ReportSectionLabel };
