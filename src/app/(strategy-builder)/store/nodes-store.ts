import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import type { Edge, Node, Viewport, ReactFlowInstance } from "@xyflow/react";
import { ensureCustomEdge } from "../_components/builder/custom-edge/edge-utils";

const initialNodes: Node[] = [
  // Start Node - Top of the flow
  {
    id: "start-1",
    type: "startNode",
    position: { x: 400, y: 50 },
    data: {
      label: "Start Strategy",
      isActive: false,
    },
  },

  // Data Source - Below start
  {
    id: "data-btc",
    type: "dataNode",
    position: { x: 400, y: 180 },
    data: {
      label: "BTC/USDT",
      dataType: "OHLCV",
      source: "Delta",
      isConnected: true,
    },
  },

  // Parallel Indicators - Below data source
  {
    id: "bollinger-bands",
    type: "indicatorNode",
    position: { x: 250, y: 320 },
    data: {
      label: "Bollinger Bands",
      indicator: "BB",
      period: 20,
      value: "±2.5%",
      isCalculating: false,
    },
  },
  {
    id: "atr-indicator",
    type: "indicatorNode",
    position: { x: 550, y: 320 },
    data: {
      label: "ATR",
      indicator: "ATR",
      period: 14,
      value: "1,250",
      isCalculating: false,
    },
  },

  // Volatility Check - Below indicators
  {
    id: "high-volatility",
    type: "conditionNode",
    position: { x: 400, y: 460 },
    data: {
      label: "High Volatility Check",
      condition: "ATR > Avg(ATR) * 1.5",
      isConfigured: true,
    },
  },

  // Parallel Breakout Detection - Below volatility check
  {
    id: "breakout-up",
    type: "conditionNode",
    position: { x: 250, y: 600 },
    data: {
      label: "Upward Breakout",
      condition: "Price > BB_Upper",
      isConfigured: true,
    },
  },
  {
    id: "breakout-down",
    type: "conditionNode",
    position: { x: 550, y: 600 },
    data: {
      label: "Downward Breakout",
      condition: "Price < BB_Lower",
      isConfigured: true,
    },
  },

  // Action Nodes - Bottom row
  {
    id: "long-position",
    type: "actionNode",
    position: { x: 150, y: 740 },
    data: {
      label: "Long Position",
      actionType: "buy",
      amount: "50%",
      isExecuting: false,
    },
  },
  {
    id: "short-position",
    type: "actionNode",
    position: { x: 400, y: 740 },
    data: {
      label: "Short Position",
      actionType: "sell",
      amount: "50%",
      isExecuting: false,
    },
  },
  {
    id: "close-positions",
    type: "actionNode",
    position: { x: 650, y: 740 },
    data: {
      label: "Close All Positions",
      actionType: "sell",
      amount: "100%",
      isExecuting: false,
    },
  },
];

const initialEdges: Edge[] = [
  // Primary Flow: Start → Data
  {
    id: "start-to-data",
    source: "start-1",
    sourceHandle: "output-1",
    target: "data-btc",
    type: "custom",
    data: {
      animated: true,
      type: "info",
      label: "Execute",
    },
  },

  // Data Distribution: Data → Indicators (parallel)
  {
    id: "data-to-bollinger",
    source: "data-btc",
    target: "bollinger-bands",
    type: "custom",
    data: {
      type: "default",
      label: "OHLCV Data",
    },
  },
  {
    id: "data-to-atr",
    source: "data-btc",
    target: "atr-indicator",
    type: "custom",
    data: {
      type: "default",
      label: "OHLCV Data",
    },
  },

  // Indicator Analysis: ATR → Volatility Check
  {
    id: "atr-to-volatility",
    source: "atr-indicator",
    target: "high-volatility",
    type: "custom",
    data: {
      type: "warning",
      label: "ATR Value",
    },
  },

  // Volatility Distribution: High Vol → Breakout Checks (parallel)
  {
    id: "volatility-to-breakout-up",
    source: "high-volatility",
    sourceHandle: "true",
    target: "breakout-up",
    type: "custom",
    data: {
      animated: true,
      type: "success",
      label: "High Volatility",
    },
  },
  {
    id: "volatility-to-breakout-down",
    source: "high-volatility",
    sourceHandle: "true",
    target: "breakout-down",
    type: "custom",
    data: {
      animated: true,
      type: "success",
      label: "High Volatility",
    },
  },

  // Signal Input: Bollinger → Breakout Conditions
  {
    id: "bollinger-to-breakout-up",
    source: "bollinger-bands",
    target: "breakout-up",
    type: "custom",
    data: {
      type: "info",
      label: "Upper Band",
    },
  },
  {
    id: "bollinger-to-breakout-down",
    source: "bollinger-bands",
    target: "breakout-down",
    type: "custom",
    data: {
      type: "info",
      label: "Lower Band",
    },
  },

  // Execution: Breakouts → Actions
  {
    id: "breakout-up-to-long",
    source: "breakout-up",
    sourceHandle: "true",
    target: "long-position",
    type: "custom",
    data: {
      animated: true,
      type: "success",
      label: "Buy Signal",
    },
  },
  {
    id: "breakout-down-to-short",
    source: "breakout-down",
    sourceHandle: "true",
    target: "short-position",
    type: "custom",
    data: {
      animated: true,
      type: "success",
      label: "Sell Signal",
    },
  },

  // Risk Management: False Breakouts → Close
  {
    id: "breakout-up-false-to-close",
    source: "breakout-up",
    sourceHandle: "false",
    target: "close-positions",
    type: "custom",
    data: {
      type: "error",
      label: "False Breakout",
    },
  },
  {
    id: "breakout-down-false-to-close",
    source: "breakout-down",
    sourceHandle: "false",
    target: "close-positions",
    type: "custom",
    data: {
      type: "error",
      label: "False Breakout",
    },
  },

  // Risk Management: Low Volatility → Close
  {
    id: "low-volatility-to-close",
    source: "high-volatility",
    sourceHandle: "false",
    target: "close-positions",
    type: "custom",
    data: {
      type: "warning",
      label: "Low Volatility",
    },
  },
];

type NodesState = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  reactFlowInstance: ReactFlowInstance | null;
  isSynced: boolean;
  activeView: string;
  isRunning: boolean;
  isBacktesting: boolean;
  isSaving: boolean;
  codeContent: string;
  // Strategy meta — populated after loading from API
  strategyId: string | null;
  strategyName: string;
  strategyDescription: string;
  isCodeModified: boolean;
  backtestTaskId: string | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  setReactFlowInstance: (instance: ReactFlowInstance) => void;
  setIsSynced: (synced: boolean) => void;
  setActiveView: (view: string) => void;
  setIsRunning: (running: boolean) => void;
  setIsBacktesting: (backtesting: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setCodeContent: (code: string) => void;
  setStrategyMeta: (id: string, name: string, description: string, isCodeModified: boolean) => void;
  setBacktestTaskId: (taskId: string | null) => void;
  initializeFromStrategy: (strategy: {
    id: string;
    name: string;
    description: string | null;
    canvas_json: Record<string, unknown>;
    compiled_code: string;
    is_code_modified: boolean;
  }) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, patch: Partial<Node>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  // Canvas control methods
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  resetView: () => void;
  reset: () => void;
};

export const useNodesStore = create<NodesState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  viewport: { x: 0, y: 0, zoom: 1 },
  reactFlowInstance: null,
  isSynced: true,
  activeView: "canvas",
  isRunning: false,
  isBacktesting: false,
  isSaving: false,
  strategyId: null,
  strategyName: "New Strategy",
  strategyDescription: "",
  isCodeModified: false,
  backtestTaskId: null,
  codeContent: `import numpy as np
import pandas as pd
from crypalgos.strategy import StrategyBase, Indicator

class CustomGridStrategy(StrategyBase):
    def initialize(self):
        self.set_universe(["BTC/USDT"])
        self.set_leverage(10)
        
        # --- Indicators ---
        self.bb = Indicator.BollingerBands(period=20, std=2.0)
        self.atr = Indicator.ATR(period=14)
        
    def on_data(self, data):
        price = data.close
        
        # Volatility check & breakout triggers
        if self.atr.value > 1250:
            if price > self.bb.upper:
                # Upward Breakout Buy
                self.buy("BTC/USDT", amount=0.5)
            elif price < self.bb.lower:
                # Downward Breakout Close / Short
                self.sell("BTC/USDT", amount=0.5)
`,

  setNodes: (nodes) => set(() => ({ nodes, isSynced: false })),
  setEdges: (edges) => set(() => ({ edges, isSynced: false })),
  setViewport: (viewport) => set(() => ({ viewport })),
  setReactFlowInstance: (instance) =>
    set(() => ({ reactFlowInstance: instance })),
  setIsSynced: (synced) => set(() => ({ isSynced: synced })),
  setActiveView: (activeView) => set(() => ({ activeView })),
  setIsRunning: (isRunning) => set(() => ({ isRunning })),
  setIsBacktesting: (isBacktesting) => set(() => ({ isBacktesting })),
  setIsSaving: (isSaving) => set(() => ({ isSaving })),
  setCodeContent: (codeContent) => set(() => ({ codeContent, isSynced: false })),

  setStrategyMeta: (id, name, description, isCodeModified) =>
    set(() => ({ strategyId: id, strategyName: name, strategyDescription: description, isCodeModified })),

  setBacktestTaskId: (backtestTaskId) => set(() => ({ backtestTaskId })),

  initializeFromStrategy: (strategy) => {
    const canvasJson = strategy.canvas_json as {
      nodes?: Node[];
      edges?: Edge[];
    };
    set(() => ({
      strategyId: strategy.id,
      strategyName: strategy.name,
      strategyDescription: strategy.description ?? "",
      isCodeModified: strategy.is_code_modified,
      codeContent: strategy.compiled_code,
      nodes: canvasJson.nodes ?? initialNodes,
      edges: canvasJson.edges ?? initialEdges,
      isSynced: true,
    }));
  },

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      isSynced: false,
    })),

  updateNode: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      isSynced: false,
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      isSynced: false,
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
      isSynced: false,
    })),

  onNodesChange: (changes) =>
    set((state) => {
      // Only set unsaved if changes actually represent mutations
      const isMutation = changes.some((c: any) => c.type === 'remove' || c.type === 'position' || c.type === 'select');
      return {
        nodes: applyNodeChanges(changes, state.nodes),
        isSynced: isMutation ? false : state.isSynced,
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isSynced: false,
    })),

  onConnect: (params) =>
    set((state) => {
      // Determine edge type based on source handle
      let edgeType = "default";
      let edgeLabel = "Connection";

      if (params.sourceHandle === "true") {
        edgeType = "success";
        edgeLabel = "True Path";
      } else if (params.sourceHandle === "false") {
        edgeType = "error";
        edgeLabel = "False Path";
      } else {
        // Find source node to determine edge type
        const sourceNode = state.nodes.find(
          (node) => node.id === params.source,
        );
        if (sourceNode) {
          switch (sourceNode.type) {
            case "startNode":
              edgeType = "info";
              edgeLabel = "Start Flow";
              break;
            case "dataNode":
              edgeType = "info";
              edgeLabel = "Data Flow";
              break;
            case "indicatorNode":
              edgeType = "warning";
              edgeLabel = "Signal";
              break;
            case "actionNode":
              edgeType = "success";
              edgeLabel = "Action Flow";
              break;
            default:
              edgeType = "default";
              edgeLabel = "Connection";
          }
        }
      }

      return {
        isSynced: false,
        edges: addEdge(
          ensureCustomEdge({
            ...params,
            type: "custom",
            data: {
              type: edgeType,
              animated: false,
              label: edgeLabel,
            },
          }),
          state.edges,
        ),
      };
    }),

  // Canvas control methods
  zoomIn: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  },

  zoomOut: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  },

  fitView: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.1 });
    }
  },

  resetView: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) {
      reactFlowInstance.setCenter(0, 0, { zoom: 1 });
    }
  },

  reset: () =>
    set(() => ({
      nodes: initialNodes,
      edges: initialEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
    })),
}));

export const nodesInitial = initialNodes;
export const edgesInitial = initialEdges;
