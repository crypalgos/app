import type { Edge, Node } from "@xyflow/react";

// --- Global Payloads ---

export interface CanvasPayload {
  canvas_version: "4.1";
  nodes: AppNode[];
  edges: Edge[];
}

export interface CompilerDiagnostic {
  node_id: string | null;
  node_label: string;
  severity: "ERROR" | "WARNING" | "INFO";
  error_code: string;
  message: string;
  suggestions: string[];
}

// --- Common Base Types ---

export interface BaseNodeData {
  createdAt?: number; // Unix timestamp
  updatedAt?: number; // Unix timestamp
  label?: string; // Standard UI label
  [key: string]: unknown; // Allow generic additions temporarily if needed, though we strive for strict typing
}

// --- Node Data Schemas ---

export interface StartNodeData extends BaseNodeData {
  exchange: "delta" | "binance";
  max_drawdown_pct?: number;     // e.g. 0.25 (25%)
  daily_loss_limit?: number;     // e.g. 1000.0 USD
  atr_sl_mult?: number;          // e.g. 2.0
  atr_tp_mult?: number;          // e.g. 4.0
  max_open_positions?: number;   // e.g. 3
}

export interface DataNodeData extends BaseNodeData {
  symbol?: string;           // e.g. "BTC/USD"
  leverage?: number;         // e.g. 10
  timeframe?: string;        // e.g. "1h"
  timeframes?: string[];    // Used for Multi-Timeframe e.g. ["1h", "4h", "1d"]
  source?: string;
  assetClass?: string;
  dataType?: string;
}

export interface IndicatorConfig {
  id: string;               // e.g. "ema_fast" or uuid
  indicator: string;        // Must match a registered indicator ID (e.g., "EMA")
  period?: number;          // Dynamic params based on indicator registry
  std?: number;             
  timeframe?: string;       // Optional MTF override
  [key: string]: any;       // Other dynamic parameters
}

export interface IndicatorNodeData extends BaseNodeData {
  indicators?: IndicatorConfig[];
}

export interface NodeOperand {
  nodeId: string;       // ID of the target indicatorNode or dataNode
  indicatorId?: string; // REQUIRED if pointing to an indicatorNode
  output: string;       // e.g. "value", "close", "upper", "macd"
  offset?: number;      // e.g. 0 for current, -1 for previous candle
}

export type ConditionOperand = NodeOperand | number;

export interface ASTCondition {
  type: "CONDITION";
  left: ConditionOperand;
  operator: ">" | "<" | "==" | "!=" | ">=" | "<=" | "CROSSES_ABOVE" | "CROSSES_BELOW";
  right: ConditionOperand;
}

export interface ASTGroup {
  type: "GROUP";
  operator: "AND" | "OR";
  children: (ASTGroup | ASTCondition)[];
}

export interface ConditionNodeData extends BaseNodeData {
  ast_root?: ASTGroup;
}

export interface ActionNodeData extends BaseNodeData {
  actionType?: "buy" | "sell" | "short" | "cover" | "close_all" | "place_limit_order" | "cancel_all_orders";
  trigger?: "IMMEDIATE" | "ON_BAR_CLOSE";
  sizing?: {
    mode: "PERCENT_OF_EQUITY" | "FIXED_USD" | "FIXED_QUANTITY";
    value: number; // e.g. 0.15 for 15%
  };
}

export interface ExitPolicy {
  id?: string;               // Unique id for the policy
  type: "STOP_LOSS" | "TAKE_PROFIT" | "TRAILING_STOP";
  mode: "PERCENTAGE" | "PRICE" | "ATR_MULTIPLE";
  value: number;             // Trigger value (must be > 0)
  quantity_pct?: number;     // How much position to close. e.g. 1.0 = 100%, 0.5 = 50%
}

export interface PolicyGroupNodeData extends BaseNodeData {
  policies: ExitPolicy[];
}

export interface PlaceholderNodeData extends BaseNodeData {
  expectedType?: string;
  parentSourceId?: string;
  parentSourceHandleId?: string | null;
  originalTargetId?: string | null;
}

// --- Strongly Typed React Flow Nodes ---

export type AppStartNode = Node<StartNodeData, "startNode">;
export type AppDataNode = Node<DataNodeData, "dataNode">;
export type AppIndicatorNode = Node<IndicatorNodeData, "indicatorNode">;
export type AppConditionNode = Node<ConditionNodeData, "conditionNode">;
export type AppActionNode = Node<ActionNodeData, "actionNode">;
export type AppPolicyGroupNode = Node<PolicyGroupNodeData, "policyGroupNode">;
export type AppPlaceholderNode = Node<PlaceholderNodeData, "placeholderNode">;

export type AppNode = 
  | AppStartNode
  | AppDataNode
  | AppIndicatorNode
  | AppConditionNode
  | AppActionNode
  | AppPolicyGroupNode
  | AppPlaceholderNode;

// Helper to determine if a node matches a specific type
export const isStartNode = (node: AppNode): node is AppStartNode => node.type === "startNode";
export const isDataNode = (node: AppNode): node is AppDataNode => node.type === "dataNode";
export const isIndicatorNode = (node: AppNode): node is AppIndicatorNode => node.type === "indicatorNode";
export const isConditionNode = (node: AppNode): node is AppConditionNode => node.type === "conditionNode";
export const isActionNode = (node: AppNode): node is AppActionNode => node.type === "actionNode";
export const isPolicyGroupNode = (node: AppNode): node is AppPolicyGroupNode => node.type === "policyGroupNode";
export const isPlaceholderNode = (node: AppNode): node is AppPlaceholderNode => node.type === "placeholderNode";
