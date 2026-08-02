import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LiveTradingActions } from "@/api-actions/live-trading-actions";
import {
  ACTIVE_SESSION_STATUSES,
  type LiveTradingSession,
  type StartLiveSessionRequest,
} from "@/types/live-trading";

export const LIVE_TRADING_KEYS = {
  all: ["live-trading"] as const,
  sessionsForStrategy: (strategyId: string) =>
    [...LIVE_TRADING_KEYS.all, "strategy", strategyId, "sessions"] as const,
  session: (strategyId: string, sessionId: string) =>
    [...LIVE_TRADING_KEYS.all, "strategy", strategyId, "session", sessionId] as const,
  fleet: (status?: string, mode?: string) =>
    [...LIVE_TRADING_KEYS.all, "fleet", status ?? "", mode ?? ""] as const,
  timeline: (sessionId: string) =>
    [...LIVE_TRADING_KEYS.all, "timeline", sessionId] as const,
};

const SESSION_POLL_INTERVAL = 3000;
const isActiveStatus = (status?: string) =>
  !!status && (ACTIVE_SESSION_STATUSES as string[]).includes(status);

/** List every session (running + past) for one strategy — the live-tab's history section.
 * Polls while any session in the list is still active so status transitions show up live. */
export const useLiveSessions = (strategyId: string | null) =>
  useQuery({
    queryKey: LIVE_TRADING_KEYS.sessionsForStrategy(strategyId ?? ""),
    queryFn: () => LiveTradingActions.listSessions(strategyId!),
    enabled: !!strategyId,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const sessions = query.state.data as LiveTradingSession[] | undefined;
      return sessions?.some((s) => isActiveStatus(s.status))
        ? SESSION_POLL_INTERVAL
        : false;
    },
    refetchIntervalInBackground: false,
  });

/** Single session detail, polled while it's STARTING/RUNNING/STOPPING. */
export const useLiveSession = (
  strategyId: string | null,
  sessionId: string | null
) =>
  useQuery({
    queryKey: LIVE_TRADING_KEYS.session(strategyId ?? "", sessionId ?? ""),
    queryFn: () => LiveTradingActions.getSession(strategyId!, sessionId!),
    enabled: !!strategyId && !!sessionId,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const session = query.state.data as LiveTradingSession | undefined;
      return isActiveStatus(session?.status) ? SESSION_POLL_INTERVAL : false;
    },
    refetchIntervalInBackground: false,
  });

/** Cross-strategy fleet list. */
export const useAllLiveSessions = (params?: { status?: string; mode?: string }) =>
  useQuery({
    queryKey: LIVE_TRADING_KEYS.fleet(params?.status, params?.mode),
    queryFn: () => LiveTradingActions.listAllSessions(params),
  });

/** REST scrollback for a session's event timeline — first paint before the WS
 * connects, and the reconnect fallback the WS hook re-fetches from. */
export const useSessionTimeline = (sessionId: string | null) =>
  useQuery({
    queryKey: LIVE_TRADING_KEYS.timeline(sessionId ?? ""),
    queryFn: () => LiveTradingActions.getTimeline(sessionId!),
    enabled: !!sessionId,
  });

export const useStartLiveSession = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartLiveSessionRequest) =>
      LiveTradingActions.startSession(strategyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: LIVE_TRADING_KEYS.sessionsForStrategy(strategyId),
      });
    },
  });
};

export const useStopLiveSession = (strategyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      LiveTradingActions.stopSession(strategyId, sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: LIVE_TRADING_KEYS.sessionsForStrategy(strategyId),
      });
      queryClient.invalidateQueries({
        queryKey: LIVE_TRADING_KEYS.session(strategyId, sessionId),
      });
    },
  });
};
