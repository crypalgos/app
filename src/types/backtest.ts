// ─── Backtest Report (S3 artifact + sub-sections) ────────────────────────────

export interface DatasetReference {
  dataset_id: string;
  path: string;
  format: "arrow";
  compression: "zstd";
  schema_version: number;
  rows?: number;
  size_bytes?: number;
  checksum?: string;
  created_at?: string;
}

export interface GlobalMetrics {
  net_profit: number;
  total_return_pct: number;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  calmar_ratio: number | null;
  profit_factor: number | null;
  max_drawdown_pct: number;
  recovery_factor: number | null;
  total_trades: number;
  win_rate: number;
}

export interface SymbolMetrics {
  net_profit: number;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  max_drawdown_pct: number;
  recovery_factor: number | null;
}

export interface RiskMetrics {
  historical_var_95: number;
  historical_var_99: number;
  cvar_95: number;
  cvar_99: number;
  ulcer_index: number;
  tail_ratio: number;
  omega_ratio: number;
  gain_to_pain_ratio: number;
}

export interface DistributionMetrics {
  average_winner: number;
  average_loser: number;
  median_winner: number;
  median_loser: number;
  largest_winner: number;
  largest_loser: number;
  payoff_ratio: number | null;
  expectancy: number | null;
  kelly_pct_raw: number | null;
  kelly_pct: number | null;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
  average_trade_duration_hours: number;
  median_trade_duration_hours: number;
}

export interface AttributionMetrics {
  portfolio_return_pct: number;
  contribution_by_symbol: Record<string, Record<string, number>>;
}

export interface DrawdownAttribution {
  method: string;
  portfolio_drawdown_pct: number;
  contribution_by_symbol: Record<string, number>;
  window_start: number | null;
  window_end: number | null;
}

export interface CapacityMetrics {
  average_position_size: number;
  maximum_position_size: number;
  average_margin_usage: number;
  maximum_margin_usage: number;
  average_gross_exposure: number;
  maximum_gross_exposure: number;
  average_net_exposure: number;
  maximum_net_exposure: number;
}

export interface ConcentrationMetrics {
  hhi_index: number | null;
  maximum_symbol_weight: number | null;
  average_symbol_weight: number | null;
  concentration_score: number | null;
  effective_number_of_assets: number | null;
}

export interface DiversificationMetrics {
  average_correlation: number | null;
  diversification_ratio: number | null;
}

export interface MetricsSection {
  global: GlobalMetrics;
  symbols: Record<string, SymbolMetrics>;
  risk: RiskMetrics;
  distributions: Record<string, DistributionMetrics>;
  capacity: CapacityMetrics;
  concentration: ConcentrationMetrics;
  diversification: DiversificationMetrics;
  attribution: AttributionMetrics;
  drawdown_attribution: DrawdownAttribution;
}

export interface CorrelationsSection {
  matrix: Record<string, Record<string, number>> | null;
  rolling: Record<string, Record<string, DatasetReference | null>> | null;
}

export interface DatasetsSection {
  global_equity_curve: DatasetReference | null;
  global_drawdown_curve: DatasetReference | null;
  symbol_equity_curves: Record<string, DatasetReference | null>;
  symbol_exposure_curves: Record<string, DatasetReference | null>;
  rolling_sharpe: Record<string, DatasetReference | null>;
  rolling_sortino: Record<string, DatasetReference | null>;
  rolling_volatility: Record<string, DatasetReference | null>;
  rolling_drawdown: Record<string, DatasetReference | null>;
  rolling_correlations: Record<string, DatasetReference | null>;
  monthly_heatmap: Record<string, Record<string, number | null>> | null;
  trades: DatasetReference | null;
  orders: DatasetReference | null;
  decision_traces: DatasetReference | null;
  runtime_events: DatasetReference | null;
  execution_logs: DatasetReference | null;
  optimizer_results: DatasetReference | null;
}

export interface AuditSection {
  warnings: string[];
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  score: number;
}

export interface EquityCurvePoint {
  timestamp: number;
  equity: number;
}

export interface AnalyticsReport {
  schema_version: number;
  metrics: MetricsSection;
  correlations: CorrelationsSection;
  monthly: { returns: Record<string, number> };
  datasets: DatasetsSection;
  research_health?: AuditSection;
  quality_score?: number;
  safety_recommendation?: string;
  warnings: string[];
  trade_audit?: Record<string, unknown>;
  trade_concentration?: Record<string, unknown>;
  correlation_health?: Record<string, unknown>;
  fractional_kelly?: Record<string, unknown>;
  dataset_health?: Record<string, unknown>;
  distribution_warnings?: string[];
  anomaly_audit?: Record<string, unknown>;
  research_observability?: Record<string, unknown>;
  equity_curve?: EquityCurvePoint[] | null;
  strategy_grade?: string;
  beta_certificate?: Record<string, unknown>;
}

export interface WorkspaceFile {
  name: string;
  type: "file" | "directory";
  size?: number;
  datasetId?: string;
  children?: WorkspaceFile[];
}

// ─── Backtest API types ──────────────────────────────────────────────────────

export interface TriggerBacktestRequest {
  start_date: string;
  end_date: string;
  initial_capital?: number;
  /** Analyse-tab exploratory run: never bumps the strategy version until saved. */
  temporary?: boolean;
}

export interface BacktestSummary {
  net_profit: number;
  total_return_pct: number;
  sharpe_ratio?: number | null;
  sortino_ratio?: number | null;
  calmar_ratio?: number | null;
  max_drawdown_pct: number;
  trade_count: number;
  win_rate: number;
  expectancy?: number | null;
  average_trade?: number;
  profit_factor?: number;
  exchange: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  leverage: number;
  equity_preview: [number, number][];
  error?: string | null;
}

export interface RunDetail {
  id: string;
  status: string;
  type: string;
  name: string;
  description?: string | null;
  is_favorite: boolean;
  progress_percent: number;
  summary: BacktestSummary | null;
  artifacts: Record<string, string> | null;
  completed_at?: string | null;
  created_at: string;
  run_hash?: string | null;
  artifact_size_bytes?: number | null;
  strategy_version_id?: string | null;
  parent_run_id?: string | null;
  updated_at: string;
}

// ─── Execution Dataset Records (Backend Parity) ────────────────────────────────

export interface OrderRecord {
  timestamp: number;
  order_id: string;
  symbol_id: string;
  side: string;
  price: number;
  quantity: number;
  status: string;
  fill_price?: number;
  filled_quantity?: number;
}

export interface CompletedTrade {
  trade_id?: string;
  symbol: string;
  side: "LONG" | "SHORT" | string;
  entry_price: number;
  exit_price: number;
  amount: number;
  entry_time: number;
  exit_time: number;
  gross_pnl: number;
  net_pnl: number;
  entry_fee: number;
  exit_fee: number;
  funding_cost: number;
  leverage: number;
  portfolio_equity_after: number;
  entry_sequence?: number | null;
  exit_sequence?: number | null;
}
