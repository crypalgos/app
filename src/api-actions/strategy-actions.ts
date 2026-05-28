import axiosInstance from "@/lib/axios-interceptor";

// ─── Request types ───────────────────────────────────────────────────────────

export interface CreateStrategyRequest {
  name: string;
  description?: string;
  canvas_json: Record<string, unknown>;
}

export interface SaveCodeRequest {
  code: string;
}

export interface UpdateCanvasRequest {
  canvas_json: Record<string, unknown>;
  name?: string;
  description?: string;
}

export interface TriggerBacktestRequest {
  exchange: string;
  symbol: string;
  start_date: string; // ISO 8601
  end_date: string;   // ISO 8601
  initial_capital?: number;
  leverage?: number;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface ApiStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  canvas_json: Record<string, unknown>;
  compiled_code: string;
  is_code_modified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BacktestTriggerResponse {
  status: string;
  task_id: string;
  message: string;
}

export interface ApiBacktest {
  id: string;
  strategy_id: string;
  exchange: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  leverage: number;
  metrics_json: Record<string, number>;
  charting_json: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedStrategiesResponse {
  total: number;
  strategies: ApiStrategy[];
  current_page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedBacktestsResponse {
  total: number;
  backtests: ApiBacktest[];
  current_page: number;
  limit: number;
  total_pages: number;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export const StrategyActions = {
  /** List all strategies for the authenticated user with pagination and search. */
  listStrategies: async (
    page = 1,
    limit = 8,
    search = ""
  ): Promise<PaginatedStrategiesResponse> => {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedStrategiesResponse>
    >("/strategies", {
      params: { page, limit, search },
    });
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
    >(`/strategies/${strategyId}/backtest`, data);
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

  /** Fetch a specific backtest run with curves intact. */
  getBacktest: async (
    strategyId: string,
    backtestId: string
  ): Promise<ApiBacktest> => {
    const response = await axiosInstance.get<ApiResponse<ApiBacktest>>(
      `/strategies/${strategyId}/backtests/${backtestId}`
    );
    return response.data.data;
  },

  /** Delete a specific backtest run. */
  deleteBacktest: async (
    strategyId: string,
    backtestId: string
  ): Promise<void> => {
    await axiosInstance.delete(`/strategies/${strategyId}/backtests/${backtestId}`);
  },

  /** Delete a strategy owned by the authenticated user. */
  deleteStrategy: async (strategyId: string): Promise<void> => {
    await axiosInstance.delete(`/strategies/${strategyId}`);
  },
};
