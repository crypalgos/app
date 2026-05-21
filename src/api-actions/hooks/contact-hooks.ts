import { useMutation } from "@tanstack/react-query";
import { AuthActions } from "@/api-actions/auth-actions";

export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data: { name: string; email: string; subject?: string; message: string }) =>
      AuthActions.ContactAction(data),
  });
};
