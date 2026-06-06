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

export const fetchConfigRegistry = async (): Promise<ConfigRegistry> => {
  const response = await axiosInstance.get("/config/registry");
  return response.data.data;
};
