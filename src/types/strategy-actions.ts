import type { CanvasPayload, CompilerDiagnostic } from "./strategy-builder";
import type {
  TriggerBacktestRequest,
  BacktestSummary,
  RunDetail,
  AnalyticsReport,
} from "./backtest";
import type {
  ParameterDefinition,
  Constraint,
  OptimizationRequest,
  OptimizationRunSummary,
} from "./optimization";
import type {
  WalkForwardRequest,
  WalkForwardRunSummary,
} from "./walkforward";
import type {
  MonteCarloRequest,
  MonteCarloRunSummary,
} from "./montecarlo";

// ─── Re-export domain types ──────────────────────────────────────────────────

export type {
  TriggerBacktestRequest,
  BacktestSummary,
  RunDetail,
  AnalyticsReport,
  ParameterDefinition,
  Constraint,
  OptimizationRequest,
  OptimizationRunSummary,
  WalkForwardRequest,
  WalkForwardRunSummary,
  MonteCarloRequest,
  MonteCarloRunSummary,
};

// Also re-export backtest sub-types (consumed by detail page components)
export type {
  GlobalMetrics,
  SymbolMetrics,
  RiskMetrics,
  DistributionMetrics,
  CapacityMetrics,
  AttributionMetrics,
  DrawdownAttribution,
  ConcentrationMetrics,
  DiversificationMetrics,
  MetricsSection,
  CorrelationsSection,
  DatasetsSection,
  AuditSection,
  DatasetReference,
  EquityCurvePoint,
  WorkspaceFile,
} from "./backtest";

// Re-export all report/card types
export type {
  // Shared
  AssetSummaryItem,
  HealthReport,
  // Optimization
  OptimizationReport,
  OptimizationResultEntry,
  OptimizationArtifact,
  OptimizationCardSummary,
} from "./optimization";
export type {
  // Shared
  RecommendationEvaluation,
  ChartReference,
  // WalkForward
  WalkForwardReport,
  WalkForwardWindowReport,
  WalkForwardArtifact,
  WalkForwardCardSummary,
} from "./walkforward";
export type {
  // Monte Carlo
  MonteCarloReport,
  MonteCarloArtifact,
  MonteCarloCardSummary,
} from "./montecarlo";

// ─── Strategy CRUD types ─────────────────────────────────────────────────────

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

// ─── Unified trigger response (all four engines) ─────────────────────────────

export interface ResearchRunTriggerResponse {
  run_id: string;
  task_id: string;
  status: string;
  message: string;
}

// ─── Unified run type & discriminated summary_json union ─────────────────────

export type ResearchRunSummary =
  | BacktestSummary
  | OptimizationRunSummary
  | WalkForwardRunSummary
  | MonteCarloRunSummary;

// Mirrors api/app/modules/strategy_service/schema/strategy_schema.py's
// RunType StrEnum. ResearchRunResponseSchema declares this field as
// `run_type: str = Field(..., alias="type")`, but the API serializes with
// model_dump(mode="json") — no by_alias=True — so the wire key is the field
// name "run_type", not the alias "type". Do not rename this back to `type`.
export type RunType = "BACKTEST" | "OPTIMIZATION" | "WALKFORWARD" | "MONTECARLO";

export interface ResearchRun {
  id: string;
  strategy_id: string;
  run_type: RunType;
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
  summary_json?: ResearchRunSummary | null;
  started_at?: string | null;
  completed_at?: string | null;
  parent_run_id?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Paginated responses (all list endpoints return the same shape) ──────────

export interface PaginatedStrategiesResponse {
  total: number;
  strategies: ApiStrategy[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedBacktestsResponse {
  total: number;
  runs: ResearchRun[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export type PaginatedOptimizationRunsResponse = PaginatedBacktestsResponse;
export type PaginatedWalkForwardRunsResponse = PaginatedBacktestsResponse;
export type PaginatedMonteCarloRunsResponse = PaginatedBacktestsResponse;

// ─── Artifact fetch ──────────────────────────────────────────────────────────

export interface ApiRunReport {
  report?: AnalyticsReport;
}
