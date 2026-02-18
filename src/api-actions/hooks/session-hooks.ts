import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SessionActions } from "@/api-actions/session-actions";

export const useSessions = () => {
  return useQuery({
    queryKey: ["user", "sessions"],
    queryFn: () => SessionActions.GetUserSessionsAction(),
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      SessionActions.DeleteSessionAction(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
    },
  });
};

export const useDeleteAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SessionActions.DeleteAllSessionsAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
    },
  });
};
