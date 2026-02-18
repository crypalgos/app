import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserActions } from "@/api-actions/user-actions";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";
import { IUserUpdateSchema } from "@/schema/user.schema";

export const useUser = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: () => UserActions.GetCurrentUserAction(),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isAuthenticated,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IUserUpdateSchema) =>
      UserActions.UpdateCurrentUserAction(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user", "me"], updatedUser);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => UserActions.DeleteCurrentUserAction(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["user", "me"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { setLogout } = useAuthStore();

  return useMutation({
    mutationFn: () => AuthActions.LogoutAction(),
    onSuccess: () => {
      setLogout();
      queryClient.removeQueries({ queryKey: ["user", "me"] });
    },
  });
};
