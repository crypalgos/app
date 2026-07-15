import axiosInstance from "@/lib/axios-interceptor";

export type Exchange = "delta" | "binance" | "bybit" | "okx";

export const EXCHANGES: { value: Exchange; label: string }[] = [
  { value: "delta", label: "Delta Exchange" },
  { value: "binance", label: "Binance" },
  { value: "bybit", label: "Bybit" },
  { value: "okx", label: "OKX" },
];

// Only Delta has a real dry-run verification call wired up on the backend today.
export const VERIFIABLE_EXCHANGES: Exchange[] = ["delta"];

export interface BrokerCredential {
  id: string;
  exchange: Exchange;
  account_label: string;
  api_key_masked: string;
  is_testnet: boolean;
  is_active: boolean;
  last_verified_at: string | null;
  last_error: string | null;
  version: number;
}

export interface SaveBrokerCredentialRequest {
  exchange: Exchange;
  account_label: string;
  api_key: string;
  api_secret: string;
  passphrase?: string;
  is_testnet: boolean;
}

export interface VerifyBrokerCredentialRequest {
  exchange: Exchange;
  api_key: string;
  api_secret: string;
  passphrase?: string;
  is_testnet: boolean;
}

export interface VerifyBrokerCredentialResponse {
  success: boolean;
  exchange: Exchange;
  account_name: string;
  permissions: string[];
  is_testnet: boolean;
  message: string;
}

export interface RotateBrokerCredentialRequest {
  api_key: string;
  api_secret: string;
  passphrase?: string;
}

export const CredentialActions = {
  /** List the authenticated user's saved broker credentials (secrets are never returned). */
  listBrokerCredentials: async (): Promise<BrokerCredential[]> => {
    const response = await axiosInstance.get<ApiResponse<BrokerCredential[]>>(
      "/credentials/broker"
    );
    return response.data.data;
  },

  /** Save (or update) an encrypted broker credential. */
  saveBrokerCredential: async (
    data: SaveBrokerCredentialRequest
  ): Promise<{ credential_id: string }> => {
    const response = await axiosInstance.post<
      ApiResponse<{ credential_id: string }>
    >("/credentials/broker", data);
    return response.data.data;
  },

  /** Dry-run verify a broker credential against the exchange (Delta only for now). */
  verifyBrokerCredential: async (
    data: VerifyBrokerCredentialRequest
  ): Promise<VerifyBrokerCredentialResponse> => {
    const response = await axiosInstance.post<
      ApiResponse<VerifyBrokerCredentialResponse>
    >("/credentials/broker/verify", data);
    return response.data.data;
  },

  /** Rotate the API key/secret for an existing credential. */
  rotateBrokerCredential: async (
    credentialId: string,
    data: RotateBrokerCredentialRequest
  ): Promise<void> => {
    await axiosInstance.post(`/credentials/broker/${credentialId}/rotate`, data);
  },

  /** Delete (soft-remove) a broker credential. */
  deleteBrokerCredential: async (credentialId: string): Promise<void> => {
    await axiosInstance.delete(`/credentials/broker/${credentialId}`);
  },
};
