import axiosInstance from "@/lib/axios-interceptor";
import type { CanvasPayload, CompilerDiagnostic } from "@/types/strategy-builder";

import type {
  CreateStrategyRequest,
  SaveCodeRequest,
  UpdateCanvasRequest,
  TriggerBacktestRequest,
  ParameterDefinition,
  Constraint,
  OptimizationRequest,
  WalkForwardRequest,
  MonteCarloRequest,
  ApiStrategy,
  BacktestTriggerResponse,
  ApiBacktest,
  OptimizationTriggerResponse,
  ApiOptimizationRun,
  WalkForwardTriggerResponse,
  ApiWalkForwardRun,
  MonteCarloTriggerResponse,
  ApiMonteCarloRun,
  PaginatedStrategiesResponse,
  PaginatedBacktestsResponse,
  PaginatedOptimizationRunsResponse,
  PaginatedWalkForwardRunsResponse,
  PaginatedMonteCarloRunsResponse,
  ResearchRun,
  ApiRunReport,
} from "@/types/strategy-actions";

export type {
  CreateStrategyRequest,
  SaveCodeRequest,
  UpdateCanvasRequest,
  TriggerBacktestRequest,
  ParameterDefinition,
  Constraint,
  OptimizationRequest,
  WalkForwardRequest,
  MonteCarloRequest,
  ApiStrategy,
  BacktestTriggerResponse,
  ApiBacktest,
  OptimizationTriggerResponse,
  ApiOptimizationRun,
  WalkForwardTriggerResponse,
  ApiWalkForwardRun,
  MonteCarloTriggerResponse,
  ApiMonteCarloRun,
  PaginatedStrategiesResponse,
  PaginatedBacktestsResponse,
  PaginatedOptimizationRunsResponse,
  PaginatedWalkForwardRunsResponse,
  PaginatedMonteCarloRunsResponse,
  ResearchRun,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export const StrategyActions = {
  /** List all strategies for the authenticated user with pagination and search. */
  listStrategies: async (
    page = 1,
    limit = 8,
    search = "",
    archived = false
  ): Promise<PaginatedStrategiesResponse> => {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedStrategiesResponse>
    >("/strategies", {
      params: { page, limit, search, archived },
    });
    return response.data.data;
  },

  /** Set a strategy version snapshot as the golden candidate. */
  setGoldenVersion: async (
    strategyId: string,
    version: number
  ): Promise<any> => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      `/strategies/${strategyId}/versions/${version}/golden`
    );
    return response.data.data;
  },

  /** Create a new visual strategy canvas. */
  createStrategy: async (
    data: CreateStrategyRequest
  ): Promise<ApiStrategy> => {
    const response = await axiosInstance.post<ApiResponse<ApiStrategy>>(
      "/strategies",
      data
    );
    return response.data.data;
  },

  /** Fetch a single strategy by ID. */
  getStrategy: async (strategyId: string): Promise<ApiStrategy> => {
    const response = await axiosInstance.get<ApiResponse<ApiStrategy>>(
      `/strategies/${strategyId}`
    );
    return response.data.data;
  },

  /** Save the visual canvas and recompile to Python. Resets is_code_modified. */
  updateCanvas: async (
    strategyId: string,
    data: UpdateCanvasRequest
  ): Promise<ApiStrategy> => {
    const response = await axiosInstance.put<ApiResponse<ApiStrategy>>(
      `/strategies/${strategyId}/canvas`,
      data
    );
    return response.data.data;
  },

  /** Overwrite compiled code from the Monaco editor. */
  saveCode: async (
    strategyId: string,
    data: SaveCodeRequest
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.put<
      ApiResponse<{ success: boolean; message: string }>
    >(`/strategies/${strategyId}/code`, data);
    return response.data.data;
  },

  /** Reset Monaco overrides — re-compile from visual canvas DAG. */
  resetBuilder: async (strategyId: string): Promise<ApiStrategy> => {
    const response = await axiosInstance.post<ApiResponse<ApiStrategy>>(
      `/strategies/${strategyId}/reset-builder`
    );
    return response.data.data;
  },

  /** Enqueue an async Celery backtest task. */
  triggerBacktest: async (
    strategyId: string,
    data: TriggerBacktestRequest
  ): Promise<BacktestTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<BacktestTriggerResponse>
    >(`/strategies/${strategyId}/backtests`, data);
    return response.data.data;
  },

  /** List all backtest runs for a strategy with pagination and filtering. */
  listBacktests: async (
    strategyId: string,
    page = 1,
    limit = 8,
    exchange?: string,
    symbol?: string
  ): Promise<PaginatedBacktestsResponse> => {
    const response = await axiosInstance.get<
      ApiResponse<{
        total: number;
        runs: ResearchRun[];
        current_page: number;
        limit: number;
        total_pages: number;
      }>
    >(`/strategies/${strategyId}/backtests`, {
      params: { page, limit, exchange, symbol },
    });

    const data = response.data.data;
    const backtests: ApiBacktest[] = (data.runs || []).map((run) => {
      const summary = run.summary_json || {};
      return {
        id: run.id,
        name: run.name,
        description: run.description ?? undefined,
        strategy_id: run.strategy_id,
        exchange: summary.exchange || "delta",
        symbol: summary.symbol || "BTCUSD",
        start_date: summary.start_date || run.created_at,
        end_date: summary.end_date || run.created_at,
        initial_capital: summary.initial_capital ?? 10000,
        leverage: summary.leverage ?? 1,
        metrics_json: {
          net_profit: summary.net_profit ?? 0,
          profit_pct: summary.total_return_pct ?? 0,
          win_rate: summary.win_rate ?? 0,
          sharpe_ratio: summary.sharpe_ratio ?? 0,
          max_drawdown: summary.max_drawdown_pct ?? 0,
          total_trades: summary.trade_count ?? 0,
          profit_factor: summary.profit_factor ?? 1.42,
          sortino_ratio: summary.sortino_ratio ?? 0,
          calmar_ratio: summary.calmar_ratio ?? 0,
          expectancy: summary.expectancy ?? 0,
          error: summary.error,
        },
        charting_json: {
          equity_curve: Array.isArray(summary.equity_preview) ? summary.equity_preview : [],
        },
        status: run.status,
        started_at: run.started_at ?? undefined,
        completed_at: run.completed_at ?? undefined,
        artifact_size_bytes: run.artifact_size_bytes ?? undefined,
        run_hash: run.run_hash ?? undefined,
        strategy_version_id: run.strategy_version_id ?? undefined,
        created_at: run.created_at,
      };
    });

    return {
      total: data.total,
      backtests,
      current_page: data.current_page,
      limit: data.limit,
      total_pages: data.total_pages,
    };
  },

  /** Fetch a specific backtest run with curves intact. */
  getBacktest: async (
    strategyId: string,
    backtestId: string
  ): Promise<ApiBacktest> => {
    const response = await axiosInstance.get<
      ApiResponse<{
        id: string;
        name?: string;
        description?: string | null;
        status: string;
        type: string;
        summary_json?: Record<string, any> | null;
        metadata: Record<string, any>;
        report: Record<string, any>;
        started_at?: string | null;
        completed_at?: string | null;
        artifact_size_bytes?: number | null;
        run_hash?: string | null;
        strategy_version_id?: string | null;
        created_at: string;
      }>
    >(`/strategies/${strategyId}/backtests/${backtestId}`);

    const data = response.data.data;
    const meta = data.metadata || {};
    const report = data.report || {};
    const summary = data.summary_json || {};

    const raw_metrics = report.metrics || {};
    const g_metrics = raw_metrics.global || raw_metrics.global_metrics || raw_metrics;

    return {
      id: data.id,
      name: data.name,
      description: data.description ?? undefined,
      strategy_id: strategyId,
      exchange: meta.exchange || summary.exchange || "delta",
      symbol: meta.symbol || summary.symbol || "BTCUSD",
      start_date: meta.start_date || summary.start_date || data.created_at,
      end_date: meta.end_date || summary.end_date || data.created_at,
      initial_capital: meta.initial_capital ?? summary.initial_capital ?? 10000,
      leverage: meta.leverage ?? summary.leverage ?? 1,
      metrics_json: {
        net_profit: g_metrics.net_profit ?? summary.net_profit ?? 0,
        profit_pct: g_metrics.total_return_pct ?? summary.total_return_pct ?? 0,
        win_rate: g_metrics.win_rate ?? summary.win_rate ?? 0,
        sharpe_ratio: g_metrics.sharpe_ratio ?? summary.sharpe_ratio ?? 0,
        max_drawdown: g_metrics.max_drawdown_pct ?? summary.max_drawdown_pct ?? 0,
        total_trades: g_metrics.total_trades ?? summary.trade_count ?? 0,
        error: summary.error,
      },
      charting_json: {
        dataset_id: report.charting?.datasets?.global_equity_curve?.dataset_id,
        trades: Array.isArray(report.charting?.trades?.recent_trades) 
          ? report.charting.trades.recent_trades 
          : (Array.isArray(report.charting?.trades) ? report.charting.trades : []),
        equity_curve: Array.isArray(summary.equity_preview) 
          ? summary.equity_preview 
          : (Array.isArray(report.charting?.datasets?.global_equity_curve) ? report.charting.datasets.global_equity_curve : []),
        drawdown_curve: Array.isArray(report.charting?.datasets?.global_drawdown_curve) 
          ? report.charting.datasets.global_drawdown_curve 
          : [],
      },
      report_json: report,
      status: data.status,
      started_at: data.started_at ?? undefined,
      completed_at: data.completed_at ?? undefined,
      artifact_size_bytes: data.artifact_size_bytes ?? undefined,
      run_hash: data.run_hash ?? undefined,
      strategy_version_id: data.strategy_version_id ?? undefined,
      created_at: data.created_at,
    };
  },

  /** Fetch a specific chart dataset for a backtest/research run */
  getRunDatasetChart: async (
    runId: string,
    datasetName: string
  ): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `/research-runs/${runId}/datasets/${datasetName}`
    );
    return response.data.data;
  },

  /** Fetch a specific artifact (like report or metadata) for a run */
  getRunArtifact: async (
    runId: string,
    artifactType: string
  ): Promise<ApiRunReport> => {
    const response = await axiosInstance.get<ApiResponse<ApiRunReport>>(
      `/research-runs/${runId}/artifacts/${artifactType}`
    );
    return response.data.data;
  },

  /** Delete a specific backtest run. */
  deleteBacktest: async (
    strategyId: string,
    backtestId: string
  ): Promise<void> => {
    await axiosInstance.delete(`/research-runs/${backtestId}`);
  },

  /** Delete a strategy owned by the authenticated user. */
  deleteStrategy: async (strategyId: string): Promise<void> => {
    await axiosInstance.delete(`/strategies/${strategyId}`);
  },

  /** Restore/unarchive a strategy from soft delete. */
  restoreStrategy: async (strategyId: string): Promise<ApiStrategy> => {
    const response = await axiosInstance.post<ApiResponse<ApiStrategy>>(
      `/strategies/${strategyId}/restore`
    );
    return response.data.data;
  },

  /** Enqueue parameter optimization job. */
  triggerOptimization: async (
    strategyId: string,
    data: OptimizationRequest
  ): Promise<OptimizationTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<OptimizationTriggerResponse>
    >(`/strategies/${strategyId}/optimizations`, data);
    return response.data.data;
  },

  /** List all optimization runs. */
  listOptimizationRuns: async (
    strategyId: string,
    page = 1,
    limit = 8,
    search = ""
  ): Promise<PaginatedOptimizationRunsResponse> => {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedOptimizationRunsResponse>
    >(`/strategies/${strategyId}/optimizations`, {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  /** Fetch a specific optimization run. */
  getOptimizationRun: async (
    strategyId: string,
    runId: string
  ): Promise<ApiOptimizationRun> => {
    const response = await axiosInstance.get<
      ApiResponse<ApiOptimizationRun>
    >(`/strategies/${strategyId}/optimizations/${runId}`);
    return response.data.data;
  },

  /** Enqueue rolling out-of-sample walkforward optimization job. */
  triggerWalkForward: async (
    strategyId: string,
    data: WalkForwardRequest
  ): Promise<WalkForwardTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<WalkForwardTriggerResponse>
    >(`/strategies/${strategyId}/walkforwards`, data);
    return response.data.data;
  },

  /** List all walkforward runs. */
  listWalkForwardRuns: async (
    strategyId: string,
    page = 1,
    limit = 8,
    search = ""
  ): Promise<PaginatedWalkForwardRunsResponse> => {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedWalkForwardRunsResponse>
    >(`/strategies/${strategyId}/walkforwards`, {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  /** Fetch a specific walkforward run. */
  getWalkForwardRun: async (
    strategyId: string,
    runId: string
  ): Promise<ApiWalkForwardRun> => {
    const response = await axiosInstance.get<
      ApiResponse<ApiWalkForwardRun>
    >(`/strategies/${strategyId}/walkforwards/${runId}`);
    return response.data.data;
  },

  /** Enqueue Monte Carlo simulation job. */
  triggerMonteCarlo: async (
    strategyId: string,
    data: MonteCarloRequest
  ): Promise<MonteCarloTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<MonteCarloTriggerResponse>
    >(`/strategies/${strategyId}/montecarlos`, data);
    return response.data.data;
  },

  /** List all Monte Carlo runs. */
  listMonteCarloRuns: async (
    strategyId: string,
    page = 1,
    limit = 8,
    search = ""
  ): Promise<PaginatedMonteCarloRunsResponse> => {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedMonteCarloRunsResponse>
    >(`/strategies/${strategyId}/montecarlos`, {
      params: { page, limit, search },
    });
    return response.data.data;
  },

  /** Fetch a specific Monte Carlo run. */
  getMonteCarloRun: async (
    strategyId: string,
    runId: string
  ): Promise<ApiMonteCarloRun> => {
    const response = await axiosInstance.get<
      ApiResponse<ApiMonteCarloRun>
    >(`/strategies/${strategyId}/montecarlos/${runId}`);
    return response.data.data;
  },
};
