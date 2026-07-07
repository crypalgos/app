"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconSkull,
  IconTargetArrow,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/shared/metric-card";
import { StatCell, ReportCard, fmtPct, fmtNum, fmtSigned, signClass } from "@/components/shared/report-primitives";
import type { MonteCarloReport } from "@/types/montecarlo";

// ADR-009: the backend now expresses every return-scale field (median_return,
// best/worst_return, risk_analysis.mean/std/var_95/cvar_95, percentiles) in
// PERCENT directly — crypalgos_core.montecarlo.reporting multiplies the
// engine's internal 0-1 fraction by 100 once, at the report boundary. Use
// plain fmtPct() everywhere on this page; no client-side rescaling needed.

// ─── Overview KPI strip — 6 cards ────────────────────────────────────────────

export function MonteCarloKpiStrip({ report }: { report: MonteCarloReport }) {
  const { summary: s, risk_analysis: ra, probability: prob } = report;
  const isRuinLow = (prob?.probability_ruin ?? s.probability_of_ruin ?? 0) < 0.05;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard
        title="Probability of Profit"
        value={prob ? fmtPct(prob.probability_profit * 100) : "—"}
        color="text-success"
        icon={IconTargetArrow}
      />
      <MetricCard
        title="Expected Return"
        value={fmtPct(ra.mean_return)}
        color={signClass(ra.mean_return)}
        icon={ra.mean_return >= 0 ? IconTrendingUp : IconTrendingDown}
      />
      <MetricCard
        title="Median Return"
        value={fmtPct(s.median_return)}
        color={signClass(s.median_return)}
      />
      <MetricCard
        title="Worst Simulation"
        value={fmtPct(s.worst_return)}
        color="text-destructive"
      />
      <MetricCard
        title="Best Simulation"
        value={fmtPct(s.best_return)}
        color="text-success"
      />
      <MetricCard
        title="Probability of Ruin"
        value={fmtPct((prob?.probability_ruin ?? s.probability_of_ruin ?? 0) * 100)}
        color={isRuinLow ? "text-success" : "text-destructive"}
        icon={IconSkull}
      />
    </div>
  );
}

// ─── Return / Drawdown side-by-side panels ────────────────────────────────────

export function ReturnDrawdownPanels({ report }: { report: MonteCarloReport }) {
  const { summary: s, robustness: rob } = report;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ReportCard title="Return Distribution">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <StatCell label="Median Return" value={fmtPct(s.median_return)} valueClass={signClass(s.median_return)} />
          <StatCell label="Median Sharpe" value={fmtNum(s.median_sharpe)} valueClass={signClass(s.median_sharpe)} />
          <StatCell label="Best Return" value={fmtPct(s.best_return)} valueClass="text-success" />
          <StatCell label="Worst Return" value={fmtPct(s.worst_return)} valueClass="text-destructive" />
        </div>
      </ReportCard>
      <ReportCard title="Drawdown Analysis">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <StatCell label="Median Drawdown" value={fmtPct(s.median_drawdown)} valueClass="text-destructive" />
          <StatCell label="Overfit Risk" value={rob.overfit_risk} valueClass={rob.overfit_risk === "LOW" ? "text-success" : rob.overfit_risk === "MEDIUM" ? "text-amber-500" : "text-destructive"} />
          <StatCell label="Best Drawdown" value={fmtPct(s.best_drawdown)} valueClass="text-success" />
          <StatCell label="Worst Drawdown" value={fmtPct(s.worst_drawdown)} valueClass="text-destructive" />
        </div>
      </ReportCard>
    </div>
  );
}

// ─── Risk analysis — matches the backtest report's RiskStatsPanel layout ─────

export function MonteCarloRiskPanel({ report }: { report: MonteCarloReport }) {
  const ra = report.risk_analysis;
  const rob = report.robustness;

  const cells: { label: string; value: string; cls?: string }[] = [
    { label: "Mean Return", value: fmtPct(ra.mean_return), cls: signClass(ra.mean_return) },
    { label: "Std Return", value: fmtPct(ra.std_return) },
    { label: "Mean Drawdown", value: fmtPct(ra.mean_drawdown), cls: "text-destructive" },
    { label: "Std Drawdown", value: fmtPct(ra.std_drawdown) },
    { label: "VaR 95%", value: fmtPct(ra.var_95), cls: signClass(ra.var_95) },
    { label: "CVaR 95%", value: fmtPct(ra.cvar_95), cls: signClass(ra.cvar_95) },
    { label: "Tail Ratio", value: fmtNum(ra.tail_ratio) },
    { label: "Skewness", value: fmtNum(ra.skewness, 3) },
    { label: "Kurtosis", value: fmtNum(ra.kurtosis, 3) },
    { label: "Consistency", value: fmtPct((rob.consistency ?? 0) * 100, 0) },
    { label: "Stability", value: fmtPct((rob.stability ?? 0) * 100, 0) },
  ];

  return (
    <ReportCard title="Risk Analysis">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
        {cells.map((c) => (
          <StatCell key={c.label} label={c.label} value={c.value} valueClass={c.cls} />
        ))}
      </div>
    </ReportCard>
  );
}

// ─── Percentile distribution ───────────────────────────────────────────────────

const PERCENTILE_KEYS = ["p01", "p05", "p10", "p25", "p50", "p75", "p90", "p95", "p99"] as const;

export function PercentileDistribution({ report }: { report: MonteCarloReport }) {
  const pct = report.percentiles;
  // Already percent-scaled by the backend (ADR-009) — no client-side rescaling.
  const scaled = PERCENTILE_KEYS.map((k) => pct[k] ?? null);
  const maxAbs = Math.max(...scaled.filter((v): v is number => v != null).map((v) => Math.abs(v)), 0.01);

  return (
    <ReportCard title="Return Percentiles">
      <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
        {PERCENTILE_KEYS.map((k, i) => {
          const value = scaled[i];
          const hasData = value != null;
          const positive = hasData && value >= 0;
          const intensity = hasData ? Math.min(Math.abs(value) / maxAbs, 1) : 0;
          return (
            <div
              key={k}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 border",
                hasData ? (positive ? "border-success/25" : "border-destructive/25") : "border-dashed border-border/30"
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
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{k.toUpperCase()}</span>
              <span className={cn("text-[13px] font-bold font-mono", hasData ? signClass(value) : "text-muted-foreground/30")}>
                {hasData ? fmtSigned(value) : "—"}%
              </span>
            </div>
          );
        })}
      </div>
    </ReportCard>
  );
}

// ─── Recommendation verdict ─────────────────────────────────────────────────────

const VERDICT_STYLES = {
  APPROVED: { border: "border-success/25", bg: "bg-success/5", badge: "bg-success/10 text-success border-success/25" },
  CAUTION: { border: "border-amber-500/25", bg: "bg-amber-500/5", badge: "bg-amber-500/10 text-amber-500 border-amber-500/25" },
  REJECTED: { border: "border-destructive/25", bg: "bg-destructive/5", badge: "bg-destructive/10 text-destructive border-destructive/25" },
} as const;

export function RecommendationCard({ report }: { report: MonteCarloReport }) {
  const rec = report.recommendation;
  const style = VERDICT_STYLES[rec.status] ?? VERDICT_STYLES.CAUTION;

  return (
    <div className={cn("rounded-xl border p-5", style.border, style.bg)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground/80 tracking-wide">Verdict</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">
            {(rec.confidence * 100).toFixed(0)}% confidence
          </span>
          <Badge className={cn("text-[10px] font-bold uppercase px-2.5 py-1", style.badge)}>{rec.status}</Badge>
        </div>
      </div>
      {rec.reasons.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {rec.reasons.map((r, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/40 mt-0.5">•</span> {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
