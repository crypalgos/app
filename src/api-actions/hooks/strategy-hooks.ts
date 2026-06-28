import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CanvasPayload } from "@/types/strategy-builder";
import {
  StrategyActions,
  type CreateStrategyRequest,
  type TriggerBacktestRequest,
  type UpdateCanvasRequest,
} from "@/api-actions/strategy-actions";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const STRATEGY_KEYS = {
  all: ["strategies"] as const,
  list: () => [...STRATEGY_KEYS.all, "list"] as const,
  detail: (id: string) => [...STRATEGY_KEYS.all, "detail", id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Fetch all strategies for the authenticated user with pagination and search. */
export const useStrategies = (page = 1, limit = 8, search = "", archived = false) =>
  useQuery({
    queryKey: [...STRATEGY_KEYS.list(), page, limit, search, archived],
    queryFn: () => StrategyActions.listStrategies(page, limit, search, archived),
    staleTime: 1000 * 30, // 30 seconds
  });

/** Fetch a single strategy by ID. */
export const useStrategy = (strategyId: string | null) =>
  useQuery({
    queryKey: STRATEGY_KEYS.detail(strategyId ?? ""),
    queryFn: () => StrategyActions.getStrategy(strategyId!),
    enabled: !!strategyId,
    staleTime: 1000 * 30,
  });

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Toggle/Set golden version of a strategy. */
export const useSetGoldenVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, version }: { strategyId: string; version: number }) =>
      StrategyActions.setGoldenVersion(strategyId, version),
    onSuccess: (_data, { strategyId }) => {
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.detail(strategyId) });
    },
  });
};

/** Create a new strategy canvas. Invalidates the list on success. */
export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStrategyRequest) =>
      StrategyActions.createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.list() });
    },
  });
};

/** Persist Monaco editor code to the backend. Invalidates the strategy detail. */
export const useSaveCode = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      StrategyActions.saveCode(strategyId, { code }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: STRATEGY_KEYS.detail(strategyId),
      });
    },
  });
};

/** Save canvas nodes/edges to backend and recompile to Python. */
export const useUpdateCanvas = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCanvasRequest) =>
      StrategyActions.updateCanvas(strategyId, data),
    onSuccess: (updatedStrategy) => {
      // Update cache directly with fresh compiled_code
      queryClient.setQueryData(
        STRATEGY_KEYS.detail(strategyId),
        updatedStrategy
      );
    },
  });
};

/** Rename a strategy (name + description only) — reads current canvas from cache so it doesn't wipe nodes. */
export const useRenameStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      strategyId,
      name,
      description,
    }: {
      strategyId: string;
      name: string;
      description: string;
    }) => {
      const cached = queryClient.getQueryData<{ canvas_json: CanvasPayload }>(
        STRATEGY_KEYS.detail(strategyId)
      );
      return StrategyActions.updateCanvas(strategyId, {
        canvas_json: cached?.canvas_json ?? { canvas_version: "4.1", nodes: [], edges: [] },
        name,
        description,
      });
    },
    onSuccess: (_data, { strategyId }) => {
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.detail(strategyId) });
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.list() });
    },
  });
};


/** Reset custom code — re-compile from visual DAG canvas. */
export const useResetBuilder = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => StrategyActions.resetBuilder(strategyId),
    onSuccess: (updatedStrategy) => {
      queryClient.setQueryData(
        STRATEGY_KEYS.detail(strategyId),
        updatedStrategy
      );
    },
  });
};

/** Enqueue an async Celery backtest. */
export const useTriggerBacktest = (strategyId: string) =>
  useMutation({
    mutationFn: (params: TriggerBacktestRequest) =>
      StrategyActions.triggerBacktest(strategyId, params),
  });

/** Permanently delete a strategy. Invalidates the list. */
export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: string) =>
      StrategyActions.deleteStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.list() });
    },
  });
};

/** Restore/unarchive a strategy from soft delete. Invalidates the list. */
export const useRestoreStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: string) =>
      StrategyActions.restoreStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.list() });
    },
  });
};


/** Fetch all backtest runs for a specific strategy with pagination and filtering. */
export const useStrategyBacktests = (
  strategyId: string | null,
  page = 1,
  limit = 8,
  exchange?: string,
  symbol?: string
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "backtests",
      page,
      limit,
      exchange,
      symbol,
    ],
    queryFn: () =>
      StrategyActions.listBacktests(strategyId!, page, limit, exchange, symbol),
    enabled: !!strategyId,
    staleTime: 1000 * 30,
  });

/** Fetch a specific backtest run with curves intact. */
export const useStrategyBacktest = (
  strategyId: string | null,
  backtestId: string | null
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "backtests",
      "detail",
      backtestId ?? "",
    ],
    queryFn: () => StrategyActions.getBacktest(strategyId!, backtestId!),
    enabled: !!strategyId && !!backtestId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

/** Delete a specific backtest run. */
export const useDeleteBacktest = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (backtestId: string) =>
      StrategyActions.deleteBacktest(strategyId, backtestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "backtests"],
      });
    },
  });
};

/** Fetch a specific chart dataset for a backtest/research run */
export const useRunDataset = (runId: string | null, datasetName: string | null) =>
  useQuery({
    queryKey: ["runs", runId, "datasets", datasetName],
    queryFn: () => StrategyActions.getRunDatasetChart(runId!, datasetName!),
    enabled: !!runId && !!datasetName,
    staleTime: Infinity,
  });

export const useRunArtifact = (runId: string | null, artifactType: string | null) =>
  useQuery({
    queryKey: ["runs", runId, "artifacts", artifactType],
    queryFn: () => StrategyActions.getRunArtifact(runId!, artifactType!),
    enabled: !!runId && !!artifactType,
    staleTime: Infinity,
  });
