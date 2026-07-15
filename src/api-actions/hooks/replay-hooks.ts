import { useQuery } from "@tanstack/react-query";
import { ReplayActions } from "@/api-actions/replay-actions";

export const REPLAY_KEYS = {
  all: ["replay"] as const,
  session: (runId: string) => [...REPLAY_KEYS.all, runId, "session"] as const,
  window: (runId: string, from: number, to: number) =>
    [...REPLAY_KEYS.all, runId, "window", from, to] as const,
  trade: (runId: string, tradeId: string) =>
    [...REPLAY_KEYS.all, runId, "trade", tradeId] as const,
};

/** Replay session bootstrap — bar range, symbols, markers. Fetched once per run. */
export const useReplaySession = (runId: string | null) =>
  useQuery({
    queryKey: REPLAY_KEYS.session(runId ?? ""),
    queryFn: () => ReplayActions.getSession(runId!),
    enabled: !!runId,
    staleTime: Infinity, // immutable workspace artifact — never changes for a given run
  });

/** One chunked replay window (candles + trees + traces + indicators). */
export const useReplayWindow = (
  runId: string | null,
  fromCandle: number | null,
  toCandle: number | null
) =>
  useQuery({
    queryKey: REPLAY_KEYS.window(runId ?? "", fromCandle ?? 0, toCandle ?? 0),
    queryFn: () => ReplayActions.getWindow(runId!, fromCandle!, toCandle!),
    enabled: !!runId && fromCandle != null && toCandle != null,
    staleTime: Infinity,
  });

/** Full trade lifecycle detail (entry/exit trees, indicators at each end). */
export const useReplayTrade = (runId: string | null, tradeId: string | null) =>
  useQuery({
    queryKey: REPLAY_KEYS.trade(runId ?? "", tradeId ?? ""),
    queryFn: () => ReplayActions.getTrade(runId!, tradeId!),
    enabled: !!runId && !!tradeId,
    staleTime: Infinity,
  });
