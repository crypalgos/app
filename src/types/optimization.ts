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

export interface OptimizationResultEntry {
  rank: number;
  score: number;
  params: Record<string, unknown>;
  metrics: {
    net_profit: number;
    profit_pct: number;
    max_drawdown: number;
    max_drawdown_pct: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
    win_rate: number;
    total_trades: number;
    profit_factor: number;
    final_balance: number;
    expectancy: number;
    average_trade: number;
    recovery_factor: number;
  };
}

export interface OptimizationReport {
  schema_version: number;
  run_id: string;
  timestamp: number;
  objective: { metric: string; direction: "maximize" | "minimize" };
  optimizer: {
    algorithm: "grid_search" | "random_search";
    version: number;
    status: "COMPLETED";
    total_candidates: number;
    completed_candidates: number;
    failed_candidates: number;
    duration_ms: number;
  };
  parameter_space: Record<string, {
    type: "integer" | "float";
    min: number;
    max: number;
    step: number;
  }>;
  summary: {
    best_rank: number;
    best_score: number;
    best_parameters: Record<string, unknown>;
  };
  asset_summary: Record<string, AssetSummaryItem>;
  results: OptimizationResultEntry[];
  parameter_sensitivity: {
    net_profit_std: number;
    net_profit_range: number;
    sharpe_std: number;
    trade_count_range: number;
    parameter_importance: Record<string, number>;
  };
  asset_reports: Record<string, string>;
  health: HealthReport;
}

// ─── Card-level summary ──────────────────────────────────────────────────────

export interface OptimizationCardSummary {
  best_parameters: Record<string, number | string>;
  total_combinations: number;
  completed_combinations: number;
  objective_value: number;
}

// ─── S3 artifact wrapper (what the API returns for artifact type "report") ───

export interface OptimizationArtifact {
  leaderboard: OptimizationResultEntry[];
  best_result: OptimizationResultEntry | null;
  total_runs: number;
}
