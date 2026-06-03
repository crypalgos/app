import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";
import { ensureCustomEdge } from "../_components/builder/custom-edge/edge-utils";



type NodesState = {
  nodes: Node[];
  edges: Edge[];
  reactFlowInstance: ReactFlowInstance | null;
  isSynced: boolean;
  activeView: string;
  isRunning: boolean;
  isBacktesting: boolean;
  isSaving: boolean;
  codeContent: string;
  selectedNodeId: string | null;
  activeCreationType: string | null;
  activeCreationSource: { nodeId: string; handleId: string | null; placeholderId?: string | null; originalTargetId?: string | null } | null;
  // Strategy meta — populated after loading from API
  strategyId: string | null;
  strategyName: string;
  strategyDescription: string;
  isCodeModified: boolean;
  setIsCodeModified: (modified: boolean) => void;
  backtestTaskId: string | null;
  setReactFlowInstance: (instance: ReactFlowInstance) => void;
  setIsSynced: (synced: boolean) => void;
  setActiveView: (view: string) => void;
  setIsRunning: (running: boolean) => void;
  setIsBacktesting: (backtesting: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setCodeContent: (code: string) => void;
  setStrategyMeta: (id: string, name: string, description: string, isCodeModified: boolean) => void;
  setBacktestTaskId: (taskId: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveCreationType: (type: string | null) => void;
  setActiveCreationSource: (source: { nodeId: string; handleId: string | null; placeholderId?: string | null; originalTargetId?: string | null } | null) => void;
  addPlaceholderNode: (sourceNodeId: string, handleId: string | null, expectedType: string) => void;
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
  updateNodeData: (id: string, dataPatch: Record<string, any>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  insertPlaceholderOnEdge: (edgeId: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  duplicateNode: (id: string) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  // Canvas control methods
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  resetView: () => void;
};

export const useNodesStore = create<NodesState>((set, get) => ({
  nodes: [],
  edges: [],
  reactFlowInstance: null,
  isSynced: true,
  activeView: "canvas",
  isRunning: false,
  isBacktesting: false,
  isSaving: false,
  selectedNodeId: null,
  activeCreationType: null,
  activeCreationSource: null,
  strategyId: null,
  strategyName: "New Strategy",
  strategyDescription: "",
  isCodeModified: false,
  backtestTaskId: null,
  codeContent: ``,

  setReactFlowInstance: (instance) =>
    set(() => ({ reactFlowInstance: instance })),
  setIsSynced: (synced) => set(() => ({ isSynced: synced })),
  setActiveView: (activeView) => set(() => ({ activeView })),
  setIsRunning: (isRunning) => set(() => ({ isRunning })),
  setIsBacktesting: (isBacktesting) => set(() => ({ isBacktesting })),
  setIsSaving: (isSaving) => set(() => ({ isSaving })),
  setCodeContent: (codeContent) => set(() => ({ codeContent, isSynced: false })),
  setIsCodeModified: (isCodeModified) => set(() => ({ isCodeModified, isSynced: false })),

  setStrategyMeta: (id, name, description, isCodeModified) =>
    set(() => ({ strategyId: id, strategyName: name, strategyDescription: description, isCodeModified, isSynced: false })),

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
      nodes: (canvasJson.nodes ?? [
        {
          id: "start-1",
          type: "startNode",
          position: { x: 400, y: 50 },
          deletable: false,
          data: { label: "Start Strategy", isActive: false },
        },
      ]).map(n => n.id === "start-1" ? { ...n, deletable: false } : n),
      edges: canvasJson.edges ?? [],
      isSynced: true,
      activeView: strategy.is_code_modified ? "code" : "canvas",
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

  updateNodeData: (id, dataPatch) =>
    set((state) => {
      const activeNode = state.nodes.find((n) => n.id === id);
      let nextNodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...dataPatch } } : n
      );

      // If we are updating startNode, also update the hidden riskManagementNode in the background
      if (activeNode && activeNode.type === "startNode") {
        const riskNode = state.nodes.find((n) => n.type === "riskManagementNode");
        if (riskNode) {
          nextNodes = nextNodes.map((n) =>
            n.type === "riskManagementNode"
              ? { ...n, data: { ...n.data, ...dataPatch } }
              : n
          );
        } else {
          // If no risk node exists, instantiate a hidden one off-screen
          const newRiskNode = {
            id: "rm-1",
            type: "riskManagementNode",
            position: { x: -9999, y: -9999 },
            data: {
              label: "Risk Guard",
              ...dataPatch,
            },
          };
          nextNodes.push(newRiskNode);
        }
      }

      return {
        nodes: nextNodes,
        isSynced: false,
      };
    }),

  setSelectedNodeId: (selectedNodeId) => set(() => ({ selectedNodeId })),

  setActiveCreationType: (activeCreationType) => set(() => ({ activeCreationType })),

  setActiveCreationSource: (activeCreationSource) => set(() => ({ activeCreationSource })),

  addPlaceholderNode: (sourceNodeId, handleId, expectedType) =>
    set((state) => {
      const parentNode = state.nodes.find((n) => n.id === sourceNodeId);
      if (!parentNode) return {};

      // Check for existing placeholder on same parent/handle
      const existingPlaceholder = state.nodes.find(
        (n) =>
          n.type === "placeholderNode" &&
          n.data?.parentSourceId === sourceNodeId &&
          n.data?.parentSourceHandleId === handleId
      );
      if (existingPlaceholder) return {};

      const placeholderId = `placeholder-${Date.now()}`;
      const x = parentNode.position.x + (Math.random() * 20 - 10);
      const y = parentNode.position.y + 130;

      const newPlaceholder = {
        id: placeholderId,
        type: "placeholderNode",
        position: { x, y },
        data: {
          expectedType,
          parentSourceId: sourceNodeId,
          parentSourceHandleId: handleId,
        },
      };

      const newEdge = {
        id: `edge-${sourceNodeId}-${placeholderId}`,
        source: sourceNodeId,
        sourceHandle: handleId || undefined,
        target: placeholderId,
        type: "custom",
        data: {
          type: "placeholder",
          animated: false,
          label: "Add Node",
        },
      };

      return {
        nodes: [...state.nodes, newPlaceholder],
        edges: [...state.edges, newEdge],
        isSynced: false,
      };
    }),

  removeNode: (id) =>
    set((state) => {
      // Deletion protection for the start strategy root node
      if (id === "start-1") return {};
      return {
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        isSynced: false,
      };
    }),

  duplicateNode: (id) =>
    set((state) => {
      const sourceNode = state.nodes.find((n) => n.id === id);
      if (!sourceNode || sourceNode.type === "startNode") return {};

      // Clone parameters and spawn the copy at a 50px visual offset
      const duplicateId = `${sourceNode.type}-${Date.now()}`;
      const clone = {
        ...sourceNode,
        id: duplicateId,
        position: {
          x: sourceNode.position.x + 50,
          y: sourceNode.position.y + 50,
        },
        selected: false,
      };

      return {
        nodes: [...state.nodes, clone],
        isSynced: false,
      };
    }),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
      isSynced: false,
    })),

  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      isSynced: false,
    })),

  updateEdgeLabel: (id, label) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label } } : e
      ),
      isSynced: false,
    })),

  insertPlaceholderOnEdge: (edgeId) =>
    set((state) => {
      const edge = state.edges.find((e) => e.id === edgeId);
      if (!edge) return {};

      const sourceNode = state.nodes.find((n) => n.id === edge.source);
      const targetNode = state.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return {};

      // Compute midpoint coordinates
      const x = (sourceNode.position.x + targetNode.position.x) / 2;
      const y = (sourceNode.position.y + targetNode.position.y) / 2;

      const placeholderId = `placeholder-${Date.now()}`;

      // Create new placeholder node
      const newPlaceholder = {
        id: placeholderId,
        type: "placeholderNode",
        position: { x, y },
        data: {
          parentSourceId: edge.source,
          parentSourceHandleId: edge.sourceHandle || null,
          originalTargetId: edge.target,
        },
      };

      // Create two dashed placeholder edges: Source -> Placeholder and Placeholder -> Target
      const edge1 = {
        id: `edge-${edge.source}-${placeholderId}`,
        source: edge.source,
        sourceHandle: edge.sourceHandle || undefined,
        target: placeholderId,
        type: "custom",
        data: {
          type: "placeholder",
          animated: false,
          label: "Add Node",
        },
      };

      const edge2 = {
        id: `edge-${placeholderId}-${edge.target}`,
        source: placeholderId,
        target: edge.target,
        type: "custom",
        data: {
          type: "placeholder",
          animated: false,
          label: "To Target",
        },
      };

      // Remove the original edge and add the placeholder node & both draft edges
      const nextEdges = state.edges.filter((e) => e.id !== edgeId).concat(edge1, edge2);

      return {
        nodes: [...state.nodes, newPlaceholder],
        edges: nextEdges,
        isSynced: false,
      };
    }),

  onNodesChange: (changes) =>
    set((state) => {
      // Keyboard deletion protection: block removals of start-1
      const safeChanges = changes.filter(
        (c: any) => !(c.type === "remove" && c.id === "start-1")
      );
      const isMutation = safeChanges.some((c: any) => c.type === 'remove' || c.type === 'position' || c.type === 'select');
      return {
        nodes: applyNodeChanges(safeChanges, state.nodes),
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
            case "riskManagementNode":
              edgeType = "error";
              edgeLabel = "Risk Safeguard";
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
      reactFlowInstance.fitView({ padding: 0.1, maxZoom: 0.95 });
    }
  },

  resetView: () => {
    const { reactFlowInstance } = get();
    if (reactFlowInstance) {
      reactFlowInstance.setCenter(0, 0, { zoom: 1 });
    }
  },
}));

export const nodesInitial: Node[] = [];
export const edgesInitial: Edge[] = [];
