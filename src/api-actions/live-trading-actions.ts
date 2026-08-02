import axiosInstance from "@/lib/axios-interceptor";
import type {
  LiveTradingSession,
  SessionTimeline,
  StartLiveSessionRequest,
  StartLiveSessionResponse,
  StopLiveSessionResponse,
} from "@/types/live-trading";

export const LiveTradingActions = {
  /** Start a new Live or Paper trading session for a strategy. */
  startSession: async (
    strategyId: string,
    data: StartLiveSessionRequest
  ): Promise<StartLiveSessionResponse> => {
    const response = await axiosInstance.post<ApiResponse<StartLiveSessionResponse>>(
      `/strategies/${strategyId}/live-sessions`,
      data
    );
    return response.data.data;
  },

  /** Stop an active Live or Paper trading session. */
  stopSession: async (
    strategyId: string,
    sessionId: string
  ): Promise<StopLiveSessionResponse> => {
    const response = await axiosInstance.delete<ApiResponse<StopLiveSessionResponse>>(
      `/strategies/${strategyId}/live-sessions/${sessionId}`
    );
    return response.data.data;
  },

  /** Get details and current status of a single session. */
  getSession: async (
    strategyId: string,
    sessionId: string
  ): Promise<LiveTradingSession> => {
    const response = await axiosInstance.get<ApiResponse<LiveTradingSession>>(
      `/strategies/${strategyId}/live-sessions/${sessionId}`
    );
    return response.data.data;
  },

  /** List all Live/Paper sessions (running and past) for one strategy. */
  listSessions: async (strategyId: string): Promise<LiveTradingSession[]> => {
    const response = await axiosInstance.get<ApiResponse<LiveTradingSession[]>>(
      `/strategies/${strategyId}/live-sessions`
    );
    return response.data.data;
  },

  /** Cross-strategy session list (fleet view) — not scoped to one strategy_id. */
  listAllSessions: async (params?: {
    status?: string;
    mode?: string;
  }): Promise<LiveTradingSession[]> => {
    const response = await axiosInstance.get<ApiResponse<LiveTradingSession[]>>(
      "/live-sessions",
      { params }
    );
    return response.data.data;
  },

  /** REST scrollback over a session's events — used both for initial render and WS-reconnect catch-up. */
  getTimeline: async (
    sessionId: string,
    params?: { since?: string; limit?: number }
  ): Promise<SessionTimeline> => {
    const response = await axiosInstance.get<ApiResponse<SessionTimeline>>(
      `/live-sessions/${sessionId}/timeline`,
      { params }
    );
    return response.data.data;
  },
};
