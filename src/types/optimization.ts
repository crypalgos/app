// ─── Shared sub-types (reused by walkforward, montecarlo) ────────────────────

export interface AssetSummaryItem {
  net_profit: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  max_drawdown: number;
  profit_factor: number;
  win_rate: number;
  trade_count: number;
}

export interface HealthReport {
  status: string;
  warnings: string[];
  errors: string[];
}

// ─── Optimization API request types ──────────────────────────────────────────

export interface ParameterDefinition {
  name: string;
  type: "int" | "float" | "categorical" | "bool";
  min_val?: number;
  max_val?: number;
  step?: number;
  choices?: unknown[];
}

export interface Constraint {
  metric: string;
  operator: ">" | "<" | ">=" | "<=";
  value: number;
}

export interface OptimizationRequest {
  start_date: string;
  end_date: string;
  parameter_space: ParameterDefinition[];
  objective: "net_profit" | "sharpe_ratio" | "sortino_ratio" | "calmar_ratio" | "profit_factor" | "max_drawdown" | "win_rate" | "expectancy" | "average_trade" | "recovery_factor";
  search_type: "grid" | "random";
  max_runs: number;
  constraints?: Constraint[];
  initial_capital: number;
}

// ─── Optimization summary_json (stored in DB) ────────────────────────────────

export interface OptimizationRunSummary {
  net_profit: number;
  total_return_pct: number;
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  calmar_ratio?: number | null;
  max_drawdown_pct: number;
  trade_count: number;
  total_results: number;
}

// ─── Optimization Report (S3 artifact: report.msgpack.zstd) ──────────────────
//
// NOTE: api/.../tasks/optimization_tasks.py builds this payload directly via
// crypalgos_core.optimization.build_leaderboard() + the raw best
// OptimizationResult — it does NOT use crypalgos_core's richer
// OptimizationReport/build_optimization_report() (that path is currently
// unused/dead code). These types match the actual flat wire shape, not the
// unused rich one — verified against a real API response.

export interface OptimizationLeaderboardEntry {
  rank: number;
  /** Key is "parameters" here, but "params" on OptimizationBestResult below — genuinely inconsistent between the two, not a typo. */
  parameters: Record<string, number>;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  profit_factor: number;
  net_profit: number;
  /** Percent already (e.g. 20.25), no "_pct" suffix on this flat shape. */
  max_drawdown: number;
  /** Percent already (e.g. 29.66) — do not multiply by 100. */
  win_rate: number;
  total_trades: number;
}

export interface OptimizationBestResultMetrics {
  net_profit: number;
  profit_pct: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  /** Percent already (e.g. 29.66) — do not multiply by 100. */
  win_rate: number;
  total_trades: number;
  profit_factor: number;
  final_balance: number;
  expectancy: number;
  average_trade: number;
  recovery_factor: number;
  // equity_curve intentionally omitted — OptimizationResult.equity_curve is
  // never populated anywhere in crypalgos_core (always []); the backend no
  // longer ships this dead field in the report payload.
}

export interface OptimizationBestResult {
  params: Record<string, number>;
  metrics: OptimizationBestResultMetrics;
  rank: number;
}

// NOTE: an earlier OptimizationReport type here (schema_version/objective/
// optimizer/parameter_space/results[]/parameter_sensitivity/health) modeled
// crypalgos_core.workspace.reporting_models.OptimizationReport — but
// api/optimization_tasks.py never actually builds or serves that shape (it
// calls build_leaderboard() + raw OptimizationResult directly instead, see
// OptimizationLeaderboardEntry/OptimizationBestResult above). Removed rather
// than left around as a plausible-looking type nothing produces.

// ─── Card-level summary ──────────────────────────────────────────────────────

export interface OptimizationCardSummary {
  best_parameters: Record<string, number | string>;
  total_combinations: number;
  completed_combinations: number;
  objective_value: number;
}

// ─── S3 artifact wrapper (what the API returns for artifact type "report") ───

export interface OptimizationArtifact {
  leaderboard: OptimizationLeaderboardEntry[];
  best_result: OptimizationBestResult | null;
  total_runs: number;
}
