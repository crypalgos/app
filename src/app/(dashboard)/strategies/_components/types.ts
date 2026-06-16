// Shared types and constants for the dashboard strategies feature

import type { CanvasPayload } from "@/types/strategy-builder";

// ─── UI model (drives cards, tables) ─────────────────────────────────────────

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
  canvas_json?: CanvasPayload;
  is_golden?: boolean;
  current_version?: number;
  is_archived?: boolean;
  latest_metrics?: {
    return_pct: number;
    sharpe: number | null;
    drawdown: number;
  } | null;
  equity_preview?: Array<[number, number]> | null;
  research_counts?: {
    backtests: number;
    montecarlos: number;
    walkforwards: number;
    optimizations: number;
  };
}

// ─── API model (mirrors FastAPI StrategyResponseSchema) ───────────────────────

export interface ApiStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  canvas_json: CanvasPayload;
  compiled_code: string;
  is_code_modified: boolean;
  created_at: string;
  updated_at: string;
  is_golden?: boolean;
  current_version?: number;
  is_archived?: boolean;
  latest_metrics?: {
    return_pct: number;
    sharpe: number | null;
    drawdown: number;
  } | null;
  equity_preview?: Array<[number, number]> | null;
  research_counts?: {
    backtests: number;
    montecarlos: number;
    walkforwards: number;
    optimizations: number;
  };
}

/** Convert an API strategy to the UI display model. */
export function toUiStrategy(api: ApiStrategy): Strategy {
  return {
    id: api.id,
    name: api.name,
    status: "paused",
    created: new Date(api.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    performance: api.latest_metrics?.return_pct ?? 0,
    trades: api.research_counts?.backtests ?? 0,
    author: api.user_id.slice(0, 8),
    type: api.is_code_modified ? "Custom Code" : "Visual Builder",
    description: api.description ?? "No description provided.",
    canvas_json: api.canvas_json as CanvasPayload,
    is_golden: api.is_golden,
    current_version: api.current_version,
    is_archived: api.is_archived,
    latest_metrics: api.latest_metrics,
    equity_preview: api.equity_preview,
    research_counts: api.research_counts,
  };
}

// ─── Template strategies (canvas_json from crypalgos_core/tests/data) ─────────

export interface TemplateStrategy {
  name: string;
  type: string;
  performance: number;
  description: string;
  trades: number;
  canvas_json: CanvasPayload;
}

// Auto-layout helper: stacks nodes vertically with Y spacing
function withPositions(
  nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>,
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    [key: string]: unknown;
  }>
): CanvasPayload {
  // Determine column for multi-branch nodes via topological pass
  const col: Record<string, number> = {};
  const row: Record<string, number> = {};
  const visited = new Set<string>();

  // Build adjacency
  const children: Record<string, string[]> = {};
  nodes.forEach((n) => { children[n.id] = []; });
  edges.forEach((e) => {
    if (children[e.source]) children[e.source].push(e.target);
  });

  // BFS
  const queue: Array<{ id: string; r: number; c: number }> = [{ id: nodes[0]?.id ?? "", r: 0, c: 0 }];
  const colCountAtRow: Record<number, number> = {};
  while (queue.length) {
    const { id, r, c } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    row[id] = r;
    col[id] = c;
    colCountAtRow[r] = (colCountAtRow[r] ?? 0) + 1;
    const kids = children[id] ?? [];
    kids.forEach((kid, i) => {
      if (!visited.has(kid)) {
        queue.push({ id: kid, r: r + 1, c: kids.length > 1 ? i - Math.floor(kids.length / 2) : c });
      }
    });
  }

  const X_GAP = 280;
  const Y_GAP = 140;
  const BASE_X = 400;

  return {
    canvas_version: "4.1",
    nodes: nodes.map((n) => ({
      ...n,
      position: {
        x: BASE_X + (col[n.id] || 0) * 350,
        y: (row[n.id] || 0) * 180,
      },
    })) as any,
    edges: edges.map((e) => ({
      ...e,
      type: "custom",
      data: { type: "default", label: e.sourceHandle === "true" ? "True" : e.sourceHandle === "false" ? "False" : "" },
    })),
  };
}

export const TEMPLATE_STRATEGIES: TemplateStrategy[] = [
  // ─── 01 EMA Trend Following (Futures) ──────────────────────────────────────
  {
    name: "EMA Trend Following",
    type: "Trend Following",
    performance: 18.4,
    description:
      "6h futures strategy: enters long when price crosses above EMA(50). Risk-managed with ATR-based SL/TP and 10% position sizing.",
    trades: 12,
    canvas_json: withPositions(
      [
        { id: "start-1", type: "startNode", data: { label: "Start Strategy", leverage: 5 } },
        { id: "rm-1", type: "riskManagementNode", data: { position_size_pct: 0.10, max_drawdown_pct: 0.20, daily_loss_limit: null, atr_sl_mult: 2.0, atr_tp_mult: 5.0, max_open_positions: 2 } },
        { id: "data-btc", type: "dataNode", data: { symbol: "BTC/USD", source: "delta", timeframe: "6h" } },
        { id: "ind-ema-btc", type: "indicatorNode", data: { indicator: "EMA", period: 50 } },
        { id: "cond-btc-trend", type: "conditionNode", data: { condition: "Price > EMA" } },
        { id: "act-btc-buy", type: "actionNode", data: { actionType: "buy", amount: 0.1 } },
      ],
      [
        { id: "e0", source: "start-1", target: "rm-1" },
        { id: "e1", source: "rm-1", target: "data-btc" },
        { id: "e3", source: "data-btc", target: "ind-ema-btc" },
        { id: "e4", source: "ind-ema-btc", target: "cond-btc-trend" },
        { id: "e5", source: "cond-btc-trend", target: "act-btc-buy", sourceHandle: "true" },
      ]
    ),
  },

  // ─── 02 BB Mean Reversion (Perpetual) ──────────────────────────────────────
  {
    name: "BB Mean Reversion",
    type: "Mean Reversion",
    performance: 22.1,
    description:
      "Perpetual 6h strategy: buys pullbacks to Bollinger Band lower bound while price stays above EMA(200). Triple-indicator confirmation.",
    trades: 85,
    canvas_json: withPositions(
      [
        { id: "start-1", type: "startNode", data: { label: "Start Strategy", leverage: 3 } },
        { id: "rm-1", type: "riskManagementNode", data: { position_size_pct: 0.10, max_drawdown_pct: 0.20, daily_loss_limit: null, atr_sl_mult: 2.0, atr_tp_mult: 5.0, max_open_positions: 2 } },
        { id: "data-btc", type: "dataNode", data: { symbol: "BTC/USD", source: "delta", timeframe: "6h" } },
        { id: "ind-ema-btc", type: "indicatorNode", data: { indicator: "EMA", period: 200 } },
        { id: "ind-bb-btc", type: "indicatorNode", data: { indicator: "BB", period: 20, std: 1.5 } },
        { id: "ind-atr-btc", type: "indicatorNode", data: { indicator: "ATR", period: 14 } },
        { id: "cond-btc-uptrend", type: "conditionNode", data: { condition: "Price > EMA" } },
        { id: "cond-btc-pullback", type: "conditionNode", data: { condition: "Price < BB_Lower" } },
        { id: "act-btc-buy", type: "actionNode", data: { actionType: "buy", amount: 0.1, sl: 0.96, tp: 1.08 } },
      ],
      [
        { id: "e0", source: "start-1", target: "rm-1" },
        { id: "e1", source: "rm-1", target: "data-btc" },
        { id: "e3", source: "data-btc", target: "ind-ema-btc" },
        { id: "e4", source: "data-btc", target: "ind-bb-btc" },
        { id: "e5", source: "data-btc", target: "ind-atr-btc" },
        { id: "e6", source: "ind-ema-btc", target: "cond-btc-uptrend" },
        { id: "e7", source: "ind-bb-btc", target: "cond-btc-pullback" },
        { id: "e8", source: "cond-btc-uptrend", target: "cond-btc-pullback", sourceHandle: "true" },
        { id: "e9", source: "cond-btc-pullback", target: "act-btc-buy", sourceHandle: "true" },
      ]
    ),
  },

  // ─── 06 Simple Perpetual Backtest ──────────────────────────────────────────
  {
    name: "Perpetual Long (1m Scalp)",
    type: "Scalping",
    performance: 9.7,
    description:
      "1-minute perpetual strategy with full-size position. Always-on buy condition (Price > 1000) — ideal for backtesting data pipelines.",
    trades: 620,
    canvas_json: withPositions(
      [
        { id: "start-1", type: "startNode", data: { label: "Start Strategy", leverage: 2 } },
        { id: "rm-1", type: "riskManagementNode", data: { position_size_pct: 1.0, max_drawdown_pct: 0.50, daily_loss_limit: null, atr_sl_mult: 2.0, atr_tp_mult: 5.0, max_open_positions: 1 } },
        { id: "data-btc", type: "dataNode", data: { symbol: "BTCUSD", source: "delta", timeframe: "1m" } },
        { id: "cond-always", type: "conditionNode", data: { condition: "Price > 1000" } },
        { id: "act-buy", type: "actionNode", data: { actionType: "buy", amount: 1.0 } },
      ],
      [
        { id: "e0", source: "start-1", target: "rm-1" },
        { id: "e1", source: "rm-1", target: "data-btc" },
        { id: "e2", source: "data-btc", target: "cond-always" },
        { id: "e3", source: "cond-always", target: "act-buy", sourceHandle: "true" },
      ]
    ),
  },

  // ─── 07 BB + EMA Pullback ──────────────────────────────────────────────────
  {
    name: "BB + EMA Pullback",
    type: "Multi-Indicator",
    performance: -2.3,
    description:
      "6h strategy on BTCUSD: triple-indicator setup (BB 20, ATR 14, EMA 50). Enters long when price < BB_Lower AND price > EMA — uptrend pullback.",
    trades: 1240,
    canvas_json: withPositions(
      [
        { id: "start-1", type: "startNode", data: { label: "Start Strategy", leverage: 5 } },
        { id: "rm-1", type: "riskManagementNode", data: { position_size_pct: 0.15, max_drawdown_pct: 0.30, daily_loss_limit: null, atr_sl_mult: 2.0, atr_tp_mult: 3.5, max_open_positions: 2 } },
        { id: "data-btc", type: "dataNode", data: { symbol: "BTCUSD", source: "delta", timeframe: "6h" } },
        { id: "ind-bb", type: "indicatorNode", data: { indicator: "BB", period: 20, std: 2.0 } },
        { id: "ind-atr", type: "indicatorNode", data: { indicator: "ATR", period: 14 } },
        { id: "ind-ema", type: "indicatorNode", data: { indicator: "EMA", period: 50 } },
        { id: "cond-long-trend", type: "conditionNode", data: { condition: "Price > EMA" } },
        { id: "cond-long-pullback", type: "conditionNode", data: { condition: "Price < BB_Lower" } },
        { id: "act-buy", type: "actionNode", data: { actionType: "buy", amount: 0.15 } },
      ],
      [
        { id: "e0", source: "start-1", target: "rm-1" },
        { id: "e1", source: "rm-1", target: "data-btc" },
        { id: "e2", source: "data-btc", target: "ind-bb" },
        { id: "e3", source: "data-btc", target: "ind-atr" },
        { id: "e4", source: "data-btc", target: "ind-ema" },
        { id: "e5", source: "ind-ema", target: "cond-long-trend" },
        { id: "e6", source: "cond-long-trend", target: "cond-long-pullback", sourceHandle: "true" },
        { id: "e7", source: "ind-bb", target: "cond-long-pullback" },
        { id: "e8", source: "cond-long-pullback", target: "act-buy", sourceHandle: "true" },
      ]
    ),
  },
];

// ─── Callback signatures ──────────────────────────────────────────────────────

export interface StrategyActions {
  onBacktest: (id: string) => void;
  onToggleLive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

