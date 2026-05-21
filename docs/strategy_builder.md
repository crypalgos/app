# CrypAlgos Frontend - Quantitative Strategy Builder Architecture

This document outlines the architecture, specialized data modeling, and state coordination mechanisms of the CrypAlgos **Quantitative Strategy Builder** workspace located inside `app/src/app/(strategy-builder)`.

---

## 🧭 Overview & Capabilities

The Strategy Builder is a high-fidelity visual IDE that enables quantitative traders to build, configure, and backtest complex algorithmic trading systems without writing manual code.

It integrates a high-performance visual node canvas powered by `@xyflow/react` (React Flow) alongside a production-grade code editor powered by `@monaco-editor/react`.

```
                        ┌────────────────────────┐
                        │      Visual Canvas     │
                        │    (@xyflow/react)     │
                        └───────────┬────────────┘
                                    │
                  [Two-Way Synchronization Pipeline]
                                    │
                        ┌───────────▼────────────┐
                        │    Monaco Code Editor  │
                        │  (@monaco-editor/react)│
                        └────────────────────────┘
```

---

## 📂 Folder Architecture

To ensure strict separation of concerns, the Strategy Builder isolated workspace encapsulates all local layouts, state stores, and utility modules privately within the route group:

```
(strategy-builder)/
├── _components/       # Route-level private visual primitives
│   ├── builder/       # Custom React Flow nodes (Start, Data, Indicators, Actions, Conditions)
│   ├── sidebar/       # Drag-and-drop node selector drawers
│   └── sub-nav/       # Sub-navigation controls (Run, backtest, zoom widgets, view toggles)
├── store/             # Localized high-frequency Zustand state machines
│   └── nodes-store.ts # Flow orchestration, edge connections, and code content state
├── utils/             # Localized quantitative helper functions (Code compiles, converters)
└── workflow/          # Routing segment directory
    └── [workflowid]/  
        └── page.tsx   # Dynamic workspace entrypoint for an individual strategy
```

> [!TIP]
> For a highly localized, step-by-step developer onboarding walkthrough, including complete instructions on creating new custom node types and handling state hooks, please refer directly to the **[Localized Strategy Builder Guide](/src/app/(strategy-builder)/README.md)** located in the root of the routing segment.

---

## 🔄 The Visual Node Flow State Machine (`nodes-store.ts`)

The entire canvas, nodes coordinates, links data, and script synchronization is managed through the localized Zustand store: **`nodes-store.ts`**.

### 1. Unified Node Taxonomy
We define custom Node structures mapped to quantitative parameters:

*   🏁 **Start Node (`startNode`)**: The execution entrypoint. Orchestrates initial leverage parameters and lifecycle hooks.
*   📊 **Data Node (`dataNode`)**: Fetches exchange datasets (e.g., Binance, Delta) and maps active symbols (e.g. `BTC/USDT`, `ETH/USDT`).
*   📈 **Indicator Node (`indicatorNode`)**: Computes technical indicators (Bollinger Bands, RSI, ATR) with customized parameters (periods, std devs).
*   ⚖️ **Condition Node (`conditionNode`)**: Implements logical decision gates (e.g., `ATR > Avg(ATR) * 1.5`, `Price > BB_Upper`). Generates dynamic True/False branching handles.
*   🚀 **Action Node (`actionNode`)**: Dispatches trading instructions (buy, sell, close position, size weightings) to backend execution brokers.

### 2. Specialized Edge Routing (`onConnect`)
Links between nodes are routed dynamically inside `onConnect` based on handles and connection logic:

```typescript
export const useNodesStore = create<NodesState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  
  onConnect: (params) => set((state) => {
    let edgeType = "default";
    let edgeLabel = "Connection";

    // Route links cleanly based on logical branch handles
    if (params.sourceHandle === "true") {
      edgeType = "success";
      edgeLabel = "True Path";
    } else if (params.sourceHandle === "false") {
      edgeType = "error";
      edgeLabel = "False Path";
    }
    
    return {
      isSynced: false,
      edges: addEdge({ ...params, type: "custom", data: { type: edgeType, label: edgeLabel } }, state.edges)
    };
  })
}));
```

---

## 🔁 Two-Way Visual-Code Synchronization

Traders can seamlessly toggle between the **Canvas View** and **Code View**:

1.  **Canvas-to-Code Compile**: When a node or link is added, repositioned, or configured, `isSynced` is flipped to `false`. When the user toggles the Code View, a parser in `utils/` crawls the node graph, performs a topological sort from `startNode`, and compiles a standard type-safe Python strategy script (backed by the `crypalgos-data` SDK library).
2.  **Monaco Editor Binding**: The generated script is bound directly into `@monaco-editor/react`. Changes inside Monaco update the Zustand `codeContent` slice, keeping execution logic unified.

---

## 🚀 Optimized Rendering Practices

Canvas rendering can easily trigger frame-drops when handling dozens of active drag elements. We enforce three performance rules:

1.  **Node Memoization**: All custom nodes are wrapped in `React.memo` to avoid re-rendering unless exact structural parameters in `node.data` are modified.
2.  **Edge Virtualization**: Heavy spline styling is cached. Animated indicator lines (`animated: true`) are strictly disabled during active canvas pan/zoom gestures to conserve GPU cycles.
3.  **Local Store Scoping**: The Zustand store is accessed selectively using shallow selectors to prevent unnecessary render cycles:
    ```tsx
    const { nodes, onNodesChange } = useNodesStore(
      (state) => ({ nodes: state.nodes, onNodesChange: state.onNodesChange }),
      shallow
    );
    ```
