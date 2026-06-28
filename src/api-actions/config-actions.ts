import axiosInstance from "@/lib/axios-interceptor";

export interface Instrument {
  symbol: string;
  name: string;
  coin: string;
}

export interface Broker {
  id: string;
  name: string;
  status: string;
  supportedTypes: string[];
  instruments: {
    spot?: Instrument[];
    futures?: Instrument[];
    perpetual?: Instrument[];
    options?: Instrument[];
    [key: string]: Instrument[] | undefined;
  };
}

export interface ConfigRegistry {
  indicators: Record<string, {
    label: string;
    class: string;
    params: string[];
    fields: string[];
  }>;
  brokers: Record<string, Broker>;
  timeframes: string[];
  nodeOutputs: Record<string, {
    dataType: string;
    fields: string[];
  }>;
}

let cachedRegistryPromise: Promise<ConfigRegistry> | null = null;

export const fetchConfigRegistry = async (): Promise<ConfigRegistry> => {
  if (!cachedRegistryPromise) {
    cachedRegistryPromise = axiosInstance.get("/config/registry")
      .then(response => response.data.data)
      .catch(error => {
        cachedRegistryPromise = null;
        throw error;
      });
  }
  return cachedRegistryPromise;
};
