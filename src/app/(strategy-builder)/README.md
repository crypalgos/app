# ⚙️ Quantitative Strategy Builder - Core Developer Workspace

Welcome to the internal developer guide for the **Quantitative Strategy Builder** located in `app/src/app/(strategy-builder)`. This document serves as the single source of truth (SSOT) for the architecture, state coordination, UI primitives, and extensibility patterns of the CrypAlgos strategy builder workspace.

Future developers and autonomous AI agents must refer to this document before making any changes, introducing new nodes, or refactoring canvas logic.

---

## 🧭 High-Level Architecture & Paradigm

The Strategy Builder workspace is a high-fidelity algorithmic trading environment combining a **Visual Node Canvas** (powered by `@xyflow/react`) and an **Institutional Code Editor** (powered by `@monaco-editor/react`). 

```
                                  ┌──────────────────────────┐
                                  │      Visual Canvas       │
                                  │     (@xyflow/react)      │
                                  └─────────────┬────────────┘
                                                │
                                    [Zustand Unified Store]
                                                │
                                  ┌─────────────▼────────────┐
                                  │    Monaco Code Editor    │
                                  │  (@monaco-editor/react)  │
                                  └──────────────────────────┘
```

The workspace utilizes **two-way data synchronization**, allowing traders to:
1. Drag and drop modular blocks (data inputs, technical indicators, logic gates, broker actions) to visually compile standard Python trading strategies.
2. Direct override inside Monaco Editor, writing advanced custom mathematical functions that hook into the underlying `crypalgos-data` strategy execution engine.

---

## 📂 Codebase & Folder Taxonomy

The strategy builder is strictly encapsulated within the Next.js `(strategy-builder)` private route group to avoid polluting the global components namespace.

```
(strategy-builder)/
├── _components/                       # Private, route-level visual components
│   ├── builder/                       # Low-level canvas configurations
│   │   ├── controls/                  # Custom zoom, reset, and viewport buttons
│   │   │   └── canvas-controls.tsx    # Implements fitView, zoomIn, and zoomOut
│   │   ├── custom-connection-line/    # Connection indicators shown during drag
│   │   │   └── custom-connection-line.tsx
│   │   ├── custom-edge/               # Line connections with dynamic styles
│   │   │   ├── custom-edge.tsx        # Dynamic Bezier splines with status colors
│   │   │   └── edge-utils.ts          # Normalizers and shape checks for edges
│   │   └── custom-node/               # Modular visual primitives representing flow steps
│   │       ├── start-node.tsx         # Trigger node (green handle)
│   │       ├── data-node.tsx          # Data ticker node (e.g. Binance feeds)
│   │       ├── indicator-node.tsx     # Technical Indicators (BB, ATR, SMA)
│   │       ├── condition-node.tsx     # Decision gates (True/False outputs)
│   │       └── action-node.tsx        # Trade dispatches (Buy/Sell actions)
│   ├── sidebar/                       # Drag-and-drop node selection menus
│   │   └── builder-sidebar.tsx        # Collapsible node bank drawer
│   ├── sub-nav/                       # Builder toolbar controls
│   │   └── sub-nav.tsx                # Run, backtest, sync states, view toggles
│   └── index.tsx                      # Core canvas assembly point (React Flow + Monaco)
├── store/                             # High-frequency state management
│   └── nodes-store.ts                 # Unified Zustand state machine for builder
├── utils/                             # Mathematical & compilation helpers
└── workflow/                          # Next.js Dynamic Segment
    └── [workflowid]/                  
        └── page.tsx                   # Dynamic strategy builder workspace workspace
```

---

## 🧠 The State Machine: `nodes-store.ts`

The state of the canvas, the nodes array, the edges array, and code synchronization is orchestrated globally inside the Zustand store `nodes-store.ts`.

### 1. Unified State Properties
| Slice Variable | Type | Description |
| :--- | :--- | :--- |
| `nodes` | `Node[]` | Represents the array of custom nodes present on the React Flow canvas. |
| `edges` | `Edge[]` | Standard and custom connection lines between input/output handles. |
| `viewport` | `Viewport` | Coordinates `(x, y)` and zoom level of the current viewport. |
| `reactFlowInstance` | `ReactFlowInstance` | Direct reference to the raw React Flow controller for programmatic zoom/fit. |
| `isSynced` | `boolean` | Tracks if visual nodes and Python source code are in sync. |
| `activeView` | `"canvas" \| "code"` | Current primary workspace view toggled by sub-nav. |
| `isRunning` | `boolean` | Flag indicating if strategy is running in production dry-run mode. |
| `isBacktesting`| `boolean` | Flag indicating if historical backtesting suite is running. |
| `codeContent` | `string` | The active Python script content within Monaco Editor. |

### 2. Connection Type Routing Rules
Edges are styled dynamically based on handle names or originating node types within the store's `onConnect` function:

*   **Branch Gate Nodes (`conditionNode`)**:
    *   `true` Handle $\rightarrow$ **Success** Edge (Green path, label: `"True Path"`, type: `"success"`).
    *   `false` Handle $\rightarrow$ **Error** Edge (Red path, label: `"False Path"`, type: `"error"`).
*   **Workflow Stages**:
    *   `startNode` $\rightarrow$ **Info** Edge (Blue path, label: `"Start Flow"`, type: `"info"`).
    *   `dataNode` $\rightarrow$ **Info** Edge (Blue path, label: `"Data Flow"`, type: `"info"`).
    *   `indicatorNode` $\rightarrow$ **Warning** Edge (Amber path, label: `"Signal"`, type: `"warning"`).
    *   `actionNode` $\rightarrow$ **Success** Edge (Green path, label: `"Action Flow"`, type: `"success"`).

---

## 🎨 Layout and Visual Design Standards

The Strategy Builder workspace leverages premium UI layouts to keep developers and quantitative traders engaged.

### 1. Dynamic Grids & Theme Support
The workspace coordinates with the active Tailwind CSS dark/light themes. Grid dot patterns match HSL CSS variables:
*   **Dark Mode Background**: `#151617` (Tailwind Zinc-900 equivalent) with dots styled in `#46474A`.
*   **Light Mode Background**: `#ffffff` with dots styled in `#CCCFD1`.
*   **Transitions**: Seamlessly dynamically morphs colors when the system theme modifies.

### 2. High-Fidelity Code Editor Simulation
When switching to the **Code View**, a split-screen panel simulates a local quantitative development environment:
*   **Sidebar Explorer**: Simulates active workspace file mappings (`strategy.py` is locked to Active, while `README.md` and `config.json` exist as locked contextual metadata targets).
*   **Monaco Binding**: Seamless, zero-latency text editor with custom minimaps, smooth cursor caret animations, and automatic resizing logic.

---

## 🚀 Extensibility: Step-by-Step Guides

### Guide 1: How to Create a New Custom Node Type
To add a new block type (e.g., a **Stop Loss / Risk Manager Node**):

1.  **Define the Interface & Component**:
    Create `app/src/app/(strategy-builder)/_components/builder/custom-node/risk-node.tsx`:
    ```tsx
    import React from 'react';
    import { Handle, Position } from '@xyflow/react';
    import { ShieldAlert } from 'lucide-react';
    import { Badge } from '@/components/ui/badge';

    export default function RiskNode({ data, selected }: { data: any, selected?: boolean }) {
      return (
        <div className={`relative bg-white dark:bg-[#1B1D21] border rounded-xl p-4 w-80 h-24 shadow ${selected ? 'ring ring-primary' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center text-white">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-neutral-600 dark:text-neutral-200 font-medium text-sm truncate">{data.label}</h3>
            </div>
            <Badge variant="destructive">Risk</Badge>
          </div>
          
          {/* Target Handle at top */}
          <Handle type="target" position={Position.Top} className="!w-[10px] !h-[10px] !bg-white !border-[1.5px] !border-primary !rounded-full" />
          {/* Source Handle at bottom */}
          <Handle type="source" position={Position.Bottom} className="!w-[10px] !h-[10px] !bg-white !border-[1.5px] !border-primary !rounded-full" />
        </div>
      );
    }
    ```

2.  **Register the Node inside `index.tsx`**:
    Import and append `riskNode` inside the global `nodeTypes` dictionary mapping:
    ```tsx
    import RiskNode from "./builder/custom-node/risk-node";

    const nodeTypes = {
      startNode: StartNode,
      conditionNode: ConditionNode,
      actionNode: ActionNode,
      dataNode: DataNode,
      indicatorNode: IndicatorNode,
      riskNode: RiskNode, // Registered new node type!
    };
    ```

3.  **Handle Visual Connection Types inside `nodes-store.ts`**:
    Modify the `onConnect` switch case block to assign customized styling whenever a connection originates from a `riskNode`:
    ```typescript
    case "riskNode":
      edgeType = "error"; // Styled red
      edgeLabel = "Risk Intercept";
      break;
    ```

---

### Guide 2: How to Add Custom Edge Styling
Edges are loaded from the `CustomEdge` component in `custom-edge.tsx`. To register a new custom path design:
1. Add standard classes inside `custom-edge.tsx` to handle custom type payloads (e.g. `'success'`, `'error'`, `'warning'`, `'info'`).
2. Map color coordinates using Tailwind CSS variables (e.g., `stroke-green-500` for success lines, `stroke-orange-500` for signals).

---

## ⚡️ Performance & Optimization Guidelines

To ensure the canvas sustains smooth **60 FPS** interactions when compiling graphs with dozens of nodes:

1.  **Selective Zustand Selectors**:
    *   *Do NOT* fetch the entire store using `const state = useNodesStore()`. This forces the component to re-render on any change.
    *   *Do* utilize selective slices with shallow checks:
        ```typescript
        const { nodes, onNodesChange } = useNodesStore(
          (state) => ({ nodes: state.nodes, onNodesChange: state.onNodesChange }),
          shallow
        );
        ```

2.  **Node Memoization**:
    *   Always export custom canvas node modules wrapped inside `React.memo` to skip visual re-evaluations during dragging triggers:
        ```typescript
        export default React.memo(IndicatorNode);
        ```

3.  **Active Drag Optimizations**:
    *   React Flow connection lines render simplified markers during drag sequences.
    *   Heavy splines and custom SVGs must be kept static to prevent active GPU throttle limits.

---

*This document is maintained by the Core Quant Team. Please submit an implementation plan for architectural updates before attempting functional refactors.*
