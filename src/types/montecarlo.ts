import type { AssetSummaryItem, HealthReport } from "./optimization";
import type { ChartReference } from "./walkforward";

// ─── Monte Carlo API request type ────────────────────────────────────────────

export interface MonteCarloRequest {
  source_backtest_id: string;
  simulation_count: number;
  method: "BOOTSTRAP" | "TRADE_SHUFFLE" | "RETURN_PERTURBATION" | "BLOCK_BOOTSTRAP";
  random_seed?: number;
}

// ─── Monte Carlo summary_json (stored in DB) ─────────────────────────────────

export interface MonteCarloRunSummary {
  median_drawdown: number;
  worst_drawdown: number;
  /** Two distinct ruin definitions — do not conflate. capital_ruin_probability:
   * equity ever fell below a fixed floor off starting capital.
   * drawdown_ruin_probability: peak-to-trough drawdown breached the
   * threshold (can trip without ever falling below starting capital). */
  capital_ruin_probability: number;
  drawdown_ruin_probability: number;
}

// ─── Monte Carlo Report (S3 artifact) ────────────────────────────────────────

export interface MonteCarloReport {
  /** ADR-009 Scenario Framework freeze — 3. See app/src/lib/montecarlo.ts scale notes. */
  schema_version: number;
  run_id: string;
  timestamp: number;
  configuration: {
    /** e.g. "BOOTSTRAP", or "TRADE_SHUFFLE+FUNDING_SHOCK" for a future pipeline run. */
    scenario_type: string;
    simulation_count: number;
    random_seed: number | null;
    confidence_level: number;
    slippage_model: string;
    commission_model: string;
  };
  summary: {
    median_return: number;
    best_return: number | null;
    worst_return: number | null;
    median_drawdown: number;
    best_drawdown: number;
    worst_drawdown: number;
    median_sharpe: number;
    probability_of_profit: number | null;
    /** See MonteCarloRunSummary — two distinct ruin definitions, not renames of the same number. */
    capital_ruin_probability: number;
    drawdown_ruin_probability: number;
    simulation_count: number;
  };
  asset_summary: Record<string, AssetSummaryItem>;
  robustness: {
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    consistency: number;
    stability: number;
    overfit_risk: "LOW" | "MEDIUM" | "HIGH";
  };
  risk_analysis: {
    mean_return: number;
    std_return: number;
    mean_drawdown: number;
    std_drawdown: number;
    var_95: number | null;
    cvar_95: number | null;
    tail_ratio: number | null;
    skewness: number;
    kurtosis: number;
  };
  recommendation: {
    status: "APPROVED" | "CAUTION" | "REJECTED";
    confidence: number;
    reasons: string[];
  };
  charts: Record<string, ChartReference>;
  /** Return-distribution percentiles (percent scale) — NOT the probability table, see `probability` below. */
  percentiles: {
    p01: number | undefined;
    p05: number | undefined;
    p10: number | undefined;
    p25: number | undefined;
    p50: number | undefined;
    p75: number | undefined;
    p90: number | undefined;
    p95: number | undefined;
    p99: number | undefined;
  };
  asset_reports: Record<string, string>;
  health: HealthReport;
  /** Backend-computed probability table (ADR-009) — never derive these client-side. */
  probability: {
    probability_profit: number;
    probability_loss: number;
    probability_gt_10: number;
    probability_gt_20: number;
    probability_lt_neg20: number;
    probability_dd_gt_10: number;
    probability_dd_gt_20: number;
    probability_dd_gt_30: number;
    probability_dd_gt_50: number;
    /** See MonteCarloRunSummary — two distinct ruin definitions, not renames of the same number. */
    capital_ruin_probability: number;
    drawdown_ruin_probability: number;
    expected_dd: number;
    worst_dd: number;
    var_95: number;
    cvar_95: number;
  };
}

// ─── S3 artifact wrapper ─────────────────────────────────────────────────────

export interface MonteCarloArtifact {
  report: MonteCarloReport;
  simulation_count: number;
}

// ─── Monte Carlo dataset rows (ADR-009 — 5-dataset set) ──────────────────────
// Fetched individually per tab via useMonteCarloDataset(runId, name) — never
// bundled into the report; the frontend does zero statistical computation.

export interface SamplePathRow {
  simulation_id: number;
  step: number;
  equity: number;
  drawdown: number;
}

export interface PercentileBandRow {
  step: number;
  metric: "equity" | "drawdown";
  p01: number; p05: number; p10: number; p25: number; p50: number;
  p75: number; p90: number; p95: number; p99: number;
}

export interface SimulationSummaryRow {
  simulation_id: number;
  scenario_type: string;
  /** JSON-encoded — parse before use. */
  scenario_parameters: string;
  scenario_hash: string;
  seed: number | null;
  simulation_rank: number;
  ending_percentile: number;
  /** Fraction (e.g. 0.159), not percent — see app/src/lib/montecarlo.ts. */
  ending_return: number;
  ending_equity: number;
  /** Percent, already x100. */
  max_drawdown: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  omega: number;
  profit_factor: number;
  /** p95/abs(p5) of THIS simulation's own trade pnls — distinct from the
   * report-level risk_analysis.tail_ratio, which compares across
   * simulations' ending returns, not within one. */
  tail_ratio: number;
  expectancy: number;
  trade_count: number;
  win_rate: number;
  avg_trade: number;
  best_trade: number;
  worst_trade: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  /** Trade-indexed steps, not calendar days — null if never recovered. */
  recovery_steps: number | null;
  /** Peak-to-trough drawdown ruin — distinct from the report-level
   * capital_ruin_probability (absolute equity floor off starting capital). */
  drawdown_ruin: boolean;
}

export type DistributionMetric =
  | "ending_return" | "sharpe" | "sortino" | "calmar" | "profit_factor"
  | "max_drawdown" | "recovery_steps" | "trade_count" | "expectancy"
  | "win_rate" | "omega" | "tail_ratio";

export interface DistributionBinRow {
  metric: DistributionMetric;
  bin_index: number;
  bin_start: number;
  bin_end: number;
  count: number;
  mean: number;
  median: number;
  std: number;
  p05: number;
  p95: number;
}

export interface RealEquityRow {
  step: number;
  equity: number;
  drawdown: number;
}

// ─── Card-level summary ──────────────────────────────────────────────────────

export interface MonteCarloCardSummary {
  simulations_count: number;
  capital_ruin_risk_pct: number;
  median_return_pct: number;
  worst_case_drawdown_pct: number;
  probability_of_profit: number | null;
  robustness_grade: string;
}
