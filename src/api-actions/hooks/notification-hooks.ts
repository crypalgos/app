import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NotificationActions,
  type SaveNotificationPreferenceRequest,
} from "@/api-actions/notification-actions";

const NOTIFICATION_PREFERENCE_KEY = ["notification-preference"] as const;

/** Fetch the authenticated user's notification preferences. */
export const useNotificationPreference = () =>
  useQuery({
    queryKey: NOTIFICATION_PREFERENCE_KEY,
    queryFn: () => NotificationActions.getNotificationPreference(),
    staleTime: 1000 * 30,
  });

/** Save the authenticated user's notification preferences. */
export const useSaveNotificationPreference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveNotificationPreferenceRequest) =>
      NotificationActions.saveNotificationPreference(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCE_KEY });
    },
  });
};
