import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CanvasPayload } from "@/types/strategy-builder";
import type { ResearchRun, RunDetail } from "@/types/strategy-actions";
import { useMemo } from "react";
import {
  StrategyActions,
  type CreateStrategyRequest,
  type TriggerBacktestRequest,
  type OptimizationRequest,
  type WalkForwardRequest,
  type MonteCarloRequest,
  type UpdateCanvasRequest,
} from "@/api-actions/strategy-actions";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const STRATEGY_KEYS = {
  all: ["strategies"] as const,
  list: () => [...STRATEGY_KEYS.all, "list"] as const,
  detail: (id: string) => [...STRATEGY_KEYS.all, "detail", id] as const,
};

// ─── Live polling for research runs (backtest/optimization/walkforward/montecarlo) ──

const RUN_POLL_INTERVAL = 4000;
const isTerminalRunStatus = (status?: string) =>
  status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";

/**
 * Polls while a run (or any run in a list) is still PENDING/RUNNING/RETRYING,
 * and stops automatically once it reaches a terminal status.
 */
function pollWhileActive<T>(getStatus: (data: T) => string | undefined) {
  return {
    refetchInterval: (query: { state: { data?: T; status: string } }) => {
      // A hard failure (404 deleted run, etc.) is not something that will
      // resolve on its own — stop hammering the endpoint.
      if (query.state.status === "error") return false;
      const data = query.state.data;
      return data && isTerminalRunStatus(getStatus(data)) ? false : RUN_POLL_INTERVAL;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  };
}

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

// ─── Version history hooks ───────────────────────────────────────────────────

/** Fetch the full version history (newest first) for a strategy. */
export const useStrategyVersions = (strategyId: string | null) =>
  useQuery({
    queryKey: [...STRATEGY_KEYS.detail(strategyId ?? ""), "versions"],
    queryFn: () => StrategyActions.listVersions(strategyId!),
    enabled: !!strategyId,
    staleTime: 1000 * 30,
  });

/** Restore a historical version snapshot into the current draft. */
export const useRestoreVersion = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) =>
      StrategyActions.restoreVersion(strategyId, version),
    onSuccess: (updatedStrategy) => {
      queryClient.setQueryData(STRATEGY_KEYS.detail(strategyId), updatedStrategy);
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "versions"],
      });
    },
  });
};

/** Diff a historical version's compiled code against the current draft. Fetched on demand once a version is selected. */
export const useVersionDiff = (strategyId: string | null, version: number | null) =>
  useQuery({
    queryKey: [...STRATEGY_KEYS.detail(strategyId ?? ""), "versions", version ?? 0, "diff"],
    queryFn: () => StrategyActions.diffVersion(strategyId!, version!),
    enabled: !!strategyId && version != null,
    staleTime: 1000 * 30,
  });

/** Maps strategy_version_id -> human-readable version number, for resolving run cards. */
export const useVersionNumberMap = (strategyId: string | null) => {
  const { data: versions } = useStrategyVersions(strategyId);
  return useMemo(() => {
    const map = new Map<string, number>();
    versions?.forEach((v) => map.set(v.id, v.version));
    return map;
  }, [versions]);
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
    ...pollWhileActive((res: { runs: ResearchRun[] }) =>
      res.runs.some((r) => !isTerminalRunStatus(r.status)) ? "RUNNING" : "COMPLETED"
    ),
  });

/** Fetch temporary (Analyse-tab) backtest runs for a strategy — never bumps versions until saved. */
export const useTemporaryBacktests = (
  strategyId: string | null,
  page = 1,
  limit = 8
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "backtests",
      "temporary",
      page,
      limit,
    ],
    queryFn: () =>
      StrategyActions.listBacktests(strategyId!, page, limit, undefined, undefined, true),
    enabled: !!strategyId,
    staleTime: 1000 * 15,
    ...pollWhileActive((res: { runs: ResearchRun[] }) =>
      res.runs.some((r) => !isTerminalRunStatus(r.status)) ? "RUNNING" : "COMPLETED"
    ),
  });

/** Promote a temporary Analyse-tab run into a permanent, saved backtest. */
export const useSaveBacktest = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, commitMessage }: { runId: string; commitMessage?: string }) =>
      StrategyActions.saveBacktest(runId, commitMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "backtests"],
      });
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "versions"],
      });
      queryClient.invalidateQueries({ queryKey: STRATEGY_KEYS.detail(strategyId) });
    },
  });
};

/** Toggle favorite/pin status of a run. */
export const useToggleRunFavorite = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, isFavorite }: { runId: string; isFavorite: boolean }) =>
      StrategyActions.toggleRunFavorite(runId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "backtests"],
      });
    },
  });
};

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
    ...pollWhileActive((run: RunDetail) => run.status),
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

export const useMonteCarloDataset = (runId: string | null, datasetName: string | null) =>
  useQuery({
    queryKey: ["runs", runId, "montecarlo-datasets", datasetName],
    queryFn: () => StrategyActions.getMonteCarloDataset(runId!, datasetName!),
    enabled: !!runId && !!datasetName,
    staleTime: Infinity,
  });

export const useWalkforwardDataset = (runId: string | null, datasetName: string | null) =>
  useQuery({
    queryKey: ["runs", runId, "walkforward-datasets", datasetName],
    queryFn: () => StrategyActions.getWalkforwardDataset(runId!, datasetName!),
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

// ─── Optimization hooks ──────────────────────────────────────────────────────

export const useStrategyOptimizations = (
  strategyId: string | null,
  page = 1,
  limit = 8,
  search = ""
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "optimizations",
      page,
      limit,
      search,
    ],
    queryFn: () =>
      StrategyActions.listOptimizationRuns(strategyId!, page, limit, search),
    enabled: !!strategyId,
    staleTime: 1000 * 30,
    ...pollWhileActive((res: { runs: ResearchRun[] }) =>
      res.runs.some((r) => !isTerminalRunStatus(r.status)) ? "RUNNING" : "COMPLETED"
    ),
  });

export const useStrategyOptimization = (
  strategyId: string | null,
  runId: string | null
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "optimizations",
      "detail",
      runId ?? "",
    ],
    queryFn: () => StrategyActions.getOptimizationRun(strategyId!, runId!),
    enabled: !!strategyId && !!runId,
    staleTime: 1000 * 60 * 5,
    ...pollWhileActive((run: ResearchRun) => run.status),
  });

export const useTriggerOptimization = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: OptimizationRequest) =>
      StrategyActions.triggerOptimization(strategyId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "optimizations"],
      });
    },
  });
};

export const useDeleteOptimization = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      StrategyActions.deleteBacktest(strategyId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "optimizations"],
      });
    },
  });
};

// ─── Walkforward hooks ───────────────────────────────────────────────────────

export const useStrategyWalkforwards = (
  strategyId: string | null,
  page = 1,
  limit = 8,
  search = ""
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "walkforwards",
      page,
      limit,
      search,
    ],
    queryFn: () =>
      StrategyActions.listWalkForwardRuns(strategyId!, page, limit, search),
    enabled: !!strategyId,
    staleTime: 1000 * 30,
    ...pollWhileActive((res: { runs: ResearchRun[] }) =>
      res.runs.some((r) => !isTerminalRunStatus(r.status)) ? "RUNNING" : "COMPLETED"
    ),
  });

export const useStrategyWalkforward = (
  strategyId: string | null,
  runId: string | null
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "walkforwards",
      "detail",
      runId ?? "",
    ],
    queryFn: () => StrategyActions.getWalkForwardRun(strategyId!, runId!),
    enabled: !!strategyId && !!runId,
    staleTime: 1000 * 60 * 5,
    ...pollWhileActive((run: ResearchRun) => run.status),
  });

export const useTriggerWalkForward = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: WalkForwardRequest) =>
      StrategyActions.triggerWalkForward(strategyId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "walkforwards"],
      });
    },
  });
};

export const useDeleteWalkforward = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      StrategyActions.deleteBacktest(strategyId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "walkforwards"],
      });
    },
  });
};

// ─── Monte Carlo hooks ───────────────────────────────────────────────────────

export const useStrategyMonteCarlos = (
  strategyId: string | null,
  page = 1,
  limit = 8,
  search = ""
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "montecarlos",
      page,
      limit,
      search,
    ],
    queryFn: () =>
      StrategyActions.listMonteCarloRuns(strategyId!, page, limit, search),
    enabled: !!strategyId,
    staleTime: 1000 * 30,
    ...pollWhileActive((res: { runs: ResearchRun[] }) =>
      res.runs.some((r) => !isTerminalRunStatus(r.status)) ? "RUNNING" : "COMPLETED"
    ),
  });

export const useStrategyMonteCarlo = (
  strategyId: string | null,
  runId: string | null
) =>
  useQuery({
    queryKey: [
      ...STRATEGY_KEYS.detail(strategyId ?? ""),
      "montecarlos",
      "detail",
      runId ?? "",
    ],
    queryFn: () => StrategyActions.getMonteCarloRun(strategyId!, runId!),
    enabled: !!strategyId && !!runId,
    staleTime: 1000 * 60 * 5,
    ...pollWhileActive((run: ResearchRun) => run.status),
  });

export const useTriggerMonteCarlo = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: MonteCarloRequest) =>
      StrategyActions.triggerMonteCarlo(strategyId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "montecarlos"],
      });
    },
  });
};

export const useDeleteMonteCarlo = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      StrategyActions.deleteBacktest(strategyId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STRATEGY_KEYS.detail(strategyId), "montecarlos"],
      });
    },
  });
};
