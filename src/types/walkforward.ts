import type { AssetSummaryItem, Constraint, HealthReport, ParameterDefinition } from "./optimization";

// ─── Shared sub-types ────────────────────────────────────────────────────────

export interface RecommendationEvaluation {
  passed: boolean;
  reasons: string[];
}

export interface ChartReference {
  dataset: string;
  type: string;
}

// ─── WalkForward API request type ────────────────────────────────────────────

export interface WalkForwardRequest {
  start_date: string;
  end_date: string;
  train_period_months: number;
  test_period_months: number;
  step_months: number;
  objective: "net_profit" | "sharpe_ratio" | "sortino_ratio" | "calmar_ratio" | "profit_factor" | "max_drawdown" | "win_rate" | "expectancy" | "average_trade" | "recovery_factor";
  parameter_space: ParameterDefinition[];
  constraints?: Constraint[];
  initial_capital: number;
  window_type: "rolling" | "expanding";
}

// ─── WalkForward summary_json (stored in DB) ─────────────────────────────────

export interface WalkForwardRunSummary {
  net_profit: number;
  total_return_pct: number;
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  calmar_ratio?: number | null;
  max_drawdown_pct: number;
  trade_count: number;
  windows_count: number;
}

// ─── WalkForward Report (S3 artifact) ────────────────────────────────────────

export interface WalkForwardWindowReport {
  window_id: number;
  train_start: string;
  train_end: string;
  validation_start: string;
  validation_end: string;
  parameter_set: Record<string, unknown>;
  train: { metrics: Record<string, number> };
  validation: { metrics: Record<string, number> };
  delta: { net_profit: number; sharpe: number; drawdown: number };
  evaluation: RecommendationEvaluation;
  charts: Record<string, ChartReference>;
}

export interface WalkForwardReport {
  schema_version: number;
  job_id: string;
  timestamp: number;
  configuration: {
    optimization_metric: string;
    optimization_direction: "maximize" | "minimize";
    window_type: "rolling" | "expanding";
    train_period: string;
    validation_period: string;
    step: string;
    minimum_trades: number;
  };
  windows: WalkForwardWindowReport[];
  summary: {
    robustness_score: number;
    overfitting_score: number;
    recommendation: string;
    total_windows: number;
    pass_rate: number;
    passed_windows: number;
    average_sharpe: number;
    average_drawdown: number;
    average_profit_factor: number;
    worst_window_id: number | null;
    worst_sharpe: number;
    statistical_validity: string;
    required_windows: number;
    recommended_windows: number;
  };
  aggregate_metrics: Record<string, number>;
  asset_summary: Record<string, AssetSummaryItem>;
  robustness: { score: number; grade: "A" | "B" | "C" | "D" | "F" };
  overfitting: { score: number; risk_level: "Low" | "Moderate" | "High" };
  recommendation: { evaluation: RecommendationEvaluation };
  charts: Record<string, ChartReference>;
  health: HealthReport;
  coverage: {
    train_bars: number;
    validation_bars: number;
    coverage_pct: number;
  };
  asset_reports: Record<string, string>;
  completed_at: number;
}

// ─── S3 artifact wrapper ─────────────────────────────────────────────────────

export interface WalkForwardArtifact {
  report: WalkForwardReport;
  windows_count: number;
}

// ─── Card-level summary ──────────────────────────────────────────────────────

export interface WalkForwardCardSummary {
  windows_count: number;
  pass_rate: number;
  robustness_score: number;
  overfitting_risk: string;
  out_of_sample_return: number;
  in_sample_return: number;
}
