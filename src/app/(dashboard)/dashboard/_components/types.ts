// Shared types and constants for the dashboard strategies feature

export interface Strategy {
  id: string;
  name: string;
  status: "active" | "paused" | "error";
  created: string;
  performance: number;
  trades: number;
  author: string;
  type: string;
  description: string;
}

export interface TemplateStrategy {
  name: string;
  type: string;
  performance: number;
  description: string;
  trades: number;
}

export const TEMPLATE_STRATEGIES: TemplateStrategy[] = [
  {
    name: "Golden Cross (SMA 50/200)",
    type: "Trend Following",
    performance: 18.4,
    description: "Classic golden crossover strategy on 1-day candles. Deploys with default parameters.",
    trades: 12,
  },
  {
    name: "BB Mean Reversion",
    type: "Mean Reversion",
    performance: 22.1,
    description: "Trades price reversals at the 2-standard-deviation bands. Perfect for rangebound markets.",
    trades: 85,
  },
  {
    name: "Grid Trading Bot",
    type: "Market Making",
    performance: 9.7,
    description: "Builds a grid of limit buy and sell orders to capture constant micro-volatility.",
    trades: 620,
  },
  {
    name: "Arbitrage Scalper Pro",
    type: "Arbitrage",
    performance: -2.3,
    description: "Scans cross-exchange price differences in real-time to execute micro-arbitrages.",
    trades: 1240,
  },
];

// Callback signatures used by multiple components
export interface StrategyActions {
  onBacktest: (id: string) => void;
  onToggleLive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
