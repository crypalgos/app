import { useQuery } from "@tanstack/react-query";
import { ReplayActions } from "@/api-actions/replay-actions";

export const REPLAY_KEYS = {
  all: ["replay"] as const,
  session: (runId: string) => [...REPLAY_KEYS.all, runId, "session"] as const,
  trade: (runId: string, tradeId: string) =>
    [...REPLAY_KEYS.all, runId, "trade", tradeId] as const,
  dataset: (runId: string, name: string, from: number, to: number) =>
    [...REPLAY_KEYS.all, runId, "dataset", name, from, to] as const,
};

/** Replay session bootstrap — bar range, symbols, markers. Fetched once per run. */
export const useReplaySession = (runId: string | null) =>
  useQuery({
    queryKey: REPLAY_KEYS.session(runId ?? ""),
    queryFn: () => ReplayActions.getSession(runId!),
    enabled: !!runId,
    staleTime: Infinity, // immutable workspace artifact — never changes for a given run
  });

/** Full trade lifecycle detail (entry/exit trees, indicators at each end). */
export const useReplayTrade = (runId: string | null, tradeId: string | null) =>
  useQuery({
    queryKey: REPLAY_KEYS.trade(runId ?? "", tradeId ?? ""),
    queryFn: () => ReplayActions.getTrade(runId!, tradeId!),
    enabled: !!runId && !!tradeId,
    staleTime: Infinity,
  });

/** Windowed slice of a single allowlisted dataset (trades/orders/execution_logs/...) —
 * reused by every bottom-console tab. Cached per (dataset, range) page so scrubbing
 * within an already-fetched page never refetches. */
export const useReplayDataset = (
  runId: string | null,
  datasetName: string,
  startBar: number,
  endBar: number,
  enabled = true
) =>
  useQuery({
    queryKey: REPLAY_KEYS.dataset(runId ?? "", datasetName, startBar, endBar),
    queryFn: () => ReplayActions.getDataset(runId!, datasetName, startBar, endBar),
    enabled: !!runId && enabled,
    staleTime: Infinity,
  });
