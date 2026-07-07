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
  ResearchRunTriggerResponse,
  ResearchRun,
  RunDetail,
  PaginatedStrategiesResponse,
  PaginatedBacktestsResponse,
  PaginatedOptimizationRunsResponse,
  PaginatedWalkForwardRunsResponse,
  PaginatedMonteCarloRunsResponse,
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
  ResearchRunTriggerResponse,
  ResearchRun,
  RunDetail,
  PaginatedStrategiesResponse,
  PaginatedBacktestsResponse,
  PaginatedOptimizationRunsResponse,
  PaginatedWalkForwardRunsResponse,
  PaginatedMonteCarloRunsResponse,
  ApiRunReport,
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
  ): Promise<unknown> => {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
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
  ): Promise<ResearchRunTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<ResearchRunTriggerResponse>
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
      ApiResponse<PaginatedBacktestsResponse>
    >(`/strategies/${strategyId}/backtests`, {
      params: { page, limit, exchange, symbol },
    });
    return response.data.data;
  },

  /** Fetch a single backtest run detail. */
  getBacktest: async (
    strategyId: string,
    backtestId: string
  ): Promise<RunDetail> => {
    const response = await axiosInstance.get<ApiResponse<RunDetail>>(
      `/strategies/${strategyId}/backtests/${backtestId}`
    );
    return response.data.data;
  },

  /** Fetch a specific chart dataset for a research run */
  getRunDatasetChart: async (
    runId: string,
    datasetName: string
  ): Promise<unknown[]> => {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `/research-runs/${runId}/datasets/${datasetName}`
    );
    return response.data.data;
  },

  /** Fetch a Monte Carlo chart dataset (equity_fan, returns, drawdowns, sharpes) */
  getMonteCarloDataset: async (
    runId: string,
    datasetName: string
  ): Promise<unknown[]> => {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `/research-runs/${runId}/montecarlo-datasets/${datasetName}`
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
  ): Promise<ResearchRunTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<ResearchRunTriggerResponse>
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
  ): Promise<ResearchRun> => {
    const response = await axiosInstance.get<
      ApiResponse<ResearchRun>
    >(`/strategies/${strategyId}/optimizations/${runId}`);
    return response.data.data;
  },

  /** Enqueue rolling out-of-sample walkforward optimization job. */
  triggerWalkForward: async (
    strategyId: string,
    data: WalkForwardRequest
  ): Promise<ResearchRunTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<ResearchRunTriggerResponse>
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
  ): Promise<ResearchRun> => {
    const response = await axiosInstance.get<
      ApiResponse<ResearchRun>
    >(`/strategies/${strategyId}/walkforwards/${runId}`);
    return response.data.data;
  },

  /** Enqueue Monte Carlo simulation job. */
  triggerMonteCarlo: async (
    strategyId: string,
    data: MonteCarloRequest
  ): Promise<ResearchRunTriggerResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<ResearchRunTriggerResponse>
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
  ): Promise<ResearchRun> => {
    const response = await axiosInstance.get<
      ApiResponse<ResearchRun>
    >(`/strategies/${strategyId}/montecarlos/${runId}`);
    return response.data.data;
  },
};
