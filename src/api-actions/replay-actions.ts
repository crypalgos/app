import axiosInstance from "@/lib/axios-interceptor";
import type {
  ReplaySession,
  ReplayWindow,
  ReplayTradeDetail,
} from "@/types/replay";

export const ReplayActions = {
  /** Replay session bootstrap: validated manifest, symbols, timeline markers. */
  getSession: async (runId: string): Promise<ReplaySession> => {
    const response = await axiosInstance.get<ApiResponse<ReplaySession>>(
      `/research-runs/${runId}/replay/session`
    );
    return response.data.data;
  },

  /** One replay window: candles + pre-nested event trees + traces + indicators.
   * Capped server-side at session.max_window_candles (500) candles per call. */
  getWindow: async (
    runId: string,
    fromCandle: number,
    toCandle: number
  ): Promise<ReplayWindow> => {
    const response = await axiosInstance.get<ApiResponse<ReplayWindow>>(
      `/research-runs/${runId}/replay/window`,
      { params: { from_candle: fromCandle, to_candle: toCandle } }
    );
    return response.data.data;
  },

  /** Everything about one trade: lifecycle events + entry/exit decision trees. */
  getTrade: async (runId: string, tradeId: string): Promise<ReplayTradeDetail> => {
    const response = await axiosInstance.get<ApiResponse<ReplayTradeDetail>>(
      `/research-runs/${runId}/replay/trades/${tradeId}`
    );
    return response.data.data;
  },

  /** Windowed slice of a single allowlisted replay dataset — powers the console tabs. */
  getDataset: async (
    runId: string,
    datasetName: string,
    startBar: number,
    endBar: number
  ): Promise<Record<string, unknown>[]> => {
    const response = await axiosInstance.get<ApiResponse<Record<string, unknown>[]>>(
      `/research-runs/${runId}/replay/datasets/${datasetName}`,
      { params: { start_bar: startBar, end_bar: endBar } }
    );
    return response.data.data;
  },
};
