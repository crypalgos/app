import axiosInstance from "@/lib/axios-interceptor";

export interface NotificationPreference {
  user_id: string;
  telegram_chat_id: string | null;
  telegram_enabled: boolean;
  timezone: string;
  paper_alerts: boolean;
  live_alerts: boolean;
  stoploss_alerts: boolean;
  tp_alerts: boolean;
}

export type SaveNotificationPreferenceRequest = Omit<NotificationPreference, "user_id">;

export const NotificationActions = {
  /** Fetch the authenticated user's notification preferences. */
  getNotificationPreference: async (): Promise<NotificationPreference> => {
    const response = await axiosInstance.get<ApiResponse<NotificationPreference>>(
      "/credentials/preferences/notifications"
    );
    return response.data.data;
  },

  /** Save (upsert) the authenticated user's notification preferences. */
  saveNotificationPreference: async (
    data: SaveNotificationPreferenceRequest
  ): Promise<void> => {
    await axiosInstance.post("/credentials/preferences/notifications", data);
  },
};
