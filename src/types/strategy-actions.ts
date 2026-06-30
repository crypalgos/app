import type { CanvasPayload, CompilerDiagnostic } from "./strategy-builder";

// ─── Request types ───────────────────────────────────────────────────────────

export interface CreateStrategyRequest {
  name: string;
  description?: string;
  canvas_json: CanvasPayload;
}

export interface SaveCodeRequest {
  code: string;
}

export interface UpdateCanvasRequest {
  canvas_json: CanvasPayload;
  name?: string;
  description?: string;
}

export interface TriggerBacktestRequest {
  start_date: string; // ISO 8601
  end_date: string;   // ISO 8601
  initial_capital?: number;
}

export interface ParameterDefinition {
  name: string;
  type: "int" | "float" | "categorical" | "bool";
  min_val?: number;
  max_val?: number;
  step?: number;
  choices?: any[];
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

export interface MonteCarloRequest {
  source_backtest_id: string;
  simulation_count: number;
  method: "BOOTSTRAP" | "TRADE_SHUFFLE" | "RETURN_PERTURBATION" | "BLOCK_BOOTSTRAP";
  random_seed?: number;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ApiStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  canvas_json: CanvasPayload;
  compiled_code: string;
  is_code_modified: boolean;
  created_at: string;
  updated_at: string;
  compile_error?: string | null;
  compile_diagnostics?: CompilerDiagnostic[] | null;
  is_golden?: boolean;
  current_version?: number;
  is_archived?: boolean;
}

export interface BacktestTriggerResponse {
  status: string;
  task_id: string;
  message: string;
}

export interface ApiBacktest {
  id: string;
  name?: string;
  description?: string;
  strategy_id: string;
  exchange: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  leverage: number;
  metrics_json: Record<string, number>;
  charting_json: Record<string, unknown>;
  report_json?: Record<string, any>;
  status?: string;
  started_at?: string;
  completed_at?: string;
  artifact_size_bytes?: number;
  run_hash?: string;
  strategy_version_id?: string;
  created_at: string;
}

export interface OptimizationTriggerResponse {
  run_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface ApiOptimizationRun {
  id: string;
  strategy_id: string;
  status: string;
  search_type: string;
  objective: "net_profit" | "sharpe_ratio" | "sortino_ratio" | "calmar_ratio" | "profit_factor" | "max_drawdown" | "win_rate" | "expectancy" | "average_trade" | "recovery_factor";
  max_runs: number;
  initial_capital: number;
  parameter_space_json: ParameterDefinition[];
  constraints_json?: Constraint[];
  best_result_json?: Record<string, any>;
  leaderboard_json?: any[];
  progress_json?: Record<string, any>;
  error_message?: string;
  credits_used: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface WalkForwardTriggerResponse {
  run_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface ApiWalkForwardRun {
  id: string;
  strategy_id: string;
  status: string;
  window_type: string;
  objective: "net_profit" | "sharpe_ratio" | "sortino_ratio" | "calmar_ratio" | "profit_factor" | "max_drawdown" | "win_rate" | "expectancy" | "average_trade" | "recovery_factor";
  initial_capital: number;
  window_config_json: Record<string, any>;
  summary_json?: Record<string, any>;
  progress_json?: Record<string, any>;
  error_message?: string;
  credits_used: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface MonteCarloTriggerResponse {
  run_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface ApiMonteCarloRun {
  id: string;
  strategy_id: string;
  source_backtest_id: string;
  status: string;
  simulation_count: number;
  method: string;
  random_seed?: number;
  summary_json?: Record<string, any>;
  progress_json?: Record<string, any>;
  error_message?: string;
  credits_used: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface PaginatedStrategiesResponse {
  total: number;
  strategies: ApiStrategy[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface ResearchRun {
  id: string;
  strategy_id: string;
  type: string;
  strategy_version_id?: string | null;
  run_hash?: string | null;
  artifact_size_bytes?: number | null;
  compiled_hash?: string | null;
  name: string;
  description?: string | null;
  is_favorite: boolean;
  status: string;
  progress_percent: number;
  report_version?: string | null;
  metadata_s3_key?: string | null;
  report_s3_key?: string | null;
  dataset_s3_key?: string | null;
  summary_json?: Record<string, any> | null;
  started_at?: string | null;
  completed_at?: string | null;
  parent_run_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedBacktestsResponse {
  total: number;
  backtests: ApiBacktest[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedOptimizationRunsResponse {
  total: number;
  runs: ApiOptimizationRun[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedWalkForwardRunsResponse {
  total: number;
  runs: ApiWalkForwardRun[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedMonteCarloRunsResponse {
  total: number;
  runs: ApiMonteCarloRun[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface GlobalMetrics {
  net_profit?: number;
  total_return_pct?: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  calmar_ratio?: number;
  profit_factor?: number;
  max_drawdown_pct?: number;
  recovery_factor?: number;
  total_trades?: number;
  win_rate?: number;
}

export interface SymbolMetric {
  net_profit?: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  max_drawdown_pct?: number;
  recovery_factor?: number;
}

export interface RiskMetrics {
  historical_var_95?: number;
  historical_var_99?: number;
  cvar_95?: number;
  cvar_99?: number;
  ulcer_index?: number;
  tail_ratio?: number;
  omega_ratio?: number;
  gain_to_pain_ratio?: number;
}

export interface DistributionMetric {
  average_winner?: number;
  average_loser?: number;
  median_winner?: number;
  median_loser?: number;
  largest_winner?: number;
  largest_loser?: number;
  payoff_ratio?: number;
  expectancy?: number;
  kelly_pct_raw?: number;
  kelly_pct?: number;
  max_consecutive_wins?: number;
  max_consecutive_losses?: number;
  average_trade_duration_hours?: number;
  median_trade_duration_hours?: number;
}

export interface CapacityMetrics {
  average_position_size?: number;
  maximum_position_size?: number;
  average_margin_usage?: number;
  maximum_margin_usage?: number;
  average_exposure?: number;
  maximum_exposure?: number;
  average_net_exposure?: number;
  maximum_net_exposure?: number;
}

export interface AttributionSymbol {
  net_profit?: number;
  contribution_pct?: number;
}

export interface Attribution {
  portfolio_return_pct?: number;
  contribution_by_symbol?: Record<string, AttributionSymbol>;
}

export interface DrawdownAttribution {
  method?: string;
  portfolio_drawdown_pct?: number;
  contribution_by_symbol?: Record<string, number>;
  window_start?: number;
  window_end?: number;
}

export interface BacktestReportMetrics {
  global?: GlobalMetrics;
  symbols?: Record<string, SymbolMetric>;
  risk?: RiskMetrics;
  distributions?: Record<string, DistributionMetric>;
  capacity?: CapacityMetrics;
  attribution?: Attribution;
  drawdown_attribution?: DrawdownAttribution;
}

export interface DatasetRef {
  dataset_id?: string;
}

export interface BacktestReportDatasets {
  global_equity_curve?: DatasetRef;
  global_drawdown_curve?: DatasetRef;
  symbol_equity_curves?: Record<string, DatasetRef>;
  symbol_exposure_curves?: Record<string, DatasetRef>;
  monthly_heatmap?: Record<string, Record<string, number | null>>;
  [key: string]: any;
}

export interface BacktestReport {
  schema_version?: string;
  metrics?: BacktestReportMetrics;
  datasets?: BacktestReportDatasets;
  monthly?: {
    returns?: Record<string, number>;
  };
}

export interface ApiRunReport {
  report?: BacktestReport;
}

