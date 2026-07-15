import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CredentialActions,
  type BrokerCredential,
  type SaveBrokerCredentialRequest,
  type VerifyBrokerCredentialRequest,
  type RotateBrokerCredentialRequest,
} from "@/api-actions/credential-actions";

export const CREDENTIAL_KEYS = {
  all: ["broker-credentials"] as const,
  list: () => [...CREDENTIAL_KEYS.all, "list"] as const,
};

/** List the authenticated user's saved broker credentials. */
export const useBrokerCredentials = () =>
  useQuery({
    queryKey: CREDENTIAL_KEYS.list(),
    queryFn: () => CredentialActions.listBrokerCredentials(),
    staleTime: 1000 * 30,
  });

/** Save a new broker credential, optimistically inserting a card before the round trip resolves. */
export const useSaveBrokerCredential = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveBrokerCredentialRequest) =>
      CredentialActions.saveBrokerCredential(data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: CREDENTIAL_KEYS.list() });
      const previous = queryClient.getQueryData<BrokerCredential[]>(
        CREDENTIAL_KEYS.list()
      );

      const optimistic: BrokerCredential = {
        id: `optimistic-${Date.now()}`,
        exchange: variables.exchange,
        account_label: variables.account_label,
        api_key_masked: `${variables.api_key.slice(0, 6)}******`,
        is_testnet: variables.is_testnet,
        is_active: true,
        last_verified_at: null,
        last_error: null,
        version: 1,
      };
      queryClient.setQueryData<BrokerCredential[]>(
        CREDENTIAL_KEYS.list(),
        (old) => [...(old ?? []), optimistic]
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CREDENTIAL_KEYS.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CREDENTIAL_KEYS.list() });
    },
  });
};

/** Dry-run verify a broker credential (does not persist anything). */
export const useVerifyBrokerCredential = () =>
  useMutation({
    mutationFn: (data: VerifyBrokerCredentialRequest) =>
      CredentialActions.verifyBrokerCredential(data),
  });

/** Rotate the API key/secret for an existing credential. */
export const useRotateBrokerCredential = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      credentialId,
      data,
    }: {
      credentialId: string;
      data: RotateBrokerCredentialRequest;
    }) => CredentialActions.rotateBrokerCredential(credentialId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDENTIAL_KEYS.list() });
    },
  });
};

/** Delete a broker credential, optimistically removing its card before the round trip resolves. */
export const useDeleteBrokerCredential = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) =>
      CredentialActions.deleteBrokerCredential(credentialId),
    onMutate: async (credentialId) => {
      await queryClient.cancelQueries({ queryKey: CREDENTIAL_KEYS.list() });
      const previous = queryClient.getQueryData<BrokerCredential[]>(
        CREDENTIAL_KEYS.list()
      );
      queryClient.setQueryData<BrokerCredential[]>(CREDENTIAL_KEYS.list(), (old) =>
        (old ?? []).filter((c) => c.id !== credentialId)
      );
      return { previous };
    },
    onError: (_err, _credentialId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CREDENTIAL_KEYS.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CREDENTIAL_KEYS.list() });
    },
  });
};
