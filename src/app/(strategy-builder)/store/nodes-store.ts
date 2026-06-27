import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import type { Edge, NodeChange, EdgeChange, Connection } from "@xyflow/react";
import type { AppNode, CanvasPayload, CompilerDiagnostic } from "@/types/strategy-builder";
import { parseCanvasPayload } from "../utils/canvas-parser";
import {  createDuplicateNode, createInsertPlaceholderNode, createNode } from "../utils/node-factory";
import { createCustomEdge, createInsertPlaceholderEdges } from "../utils/edge-factory";
import { UISlice, createUISlice } from "./slices/ui-slice";

export interface NodesEdgesSlice {
  nodes: AppNode[];
  edges: Edge[];
  
  initializeFromStrategy: (strategy: {
    id: string;
    name: string;
    description: string | null;
    canvas_json: Partial<CanvasPayload>;
    compiled_code: string;
    is_code_modified: boolean;
    compile_error?: string | null;
    compile_diagnostics?: CompilerDiagnostic[] | null;
  }) => void;
  
  addNode: (node: AppNode) => void;
  updateNode: (id: string, patch: Partial<AppNode>) => void;
  updateNodeData: (id: string, dataPatch: Record<string, any>) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  addDirectNode: (params: { parentNodeId: string, parentHandle: string | null, recommendedType: string }) => void;
  
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  insertPlaceholderOnEdge: (edgeId: string) => void;
  
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

export type StoreState = UISlice & NodesEdgesSlice;

export const useNodesStore = create<StoreState>((set, get, api) => ({
  ...createUISlice(set as unknown as any, get as unknown as any, api as unknown as any),
  
  nodes: [],
  edges: [],

  initializeFromStrategy: (strategy) => {
    const { nodes, edges } = parseCanvasPayload(strategy.canvas_json);

    set({
      strategyId: strategy.id,
      strategyName: strategy.name,
      strategyDescription: strategy.description ?? "",
      isCodeModified: strategy.is_code_modified,
      codeContent: strategy.compiled_code,
      nodes,
      edges,
      isSynced: true,
      activeView: strategy.is_code_modified ? "code" : "canvas",
      compileError: strategy.compile_error ?? null,
      compileDiagnostics: strategy.compile_diagnostics ?? null,
    });
  },

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      isSynced: false,
    })),

  updateNode: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...patch } as AppNode : n)),
      isSynced: false,
    })),

  updateNodeData: (id, dataPatch) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...dataPatch } } as AppNode : n
      ),
      isSynced: false,
    })),

  removeNode: (id) =>
    set((state) => {
      if (id === "start-1") return state; // Deletion protection for start node
      return {
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        isSynced: false,
      };
    }),

  duplicateNode: (id) =>
    set((state) => {
      const sourceNode = state.nodes.find((n) => n.id === id);
      if (!sourceNode || sourceNode.type === "startNode") return state;

      const clone = createDuplicateNode(sourceNode);
      return {
        nodes: [...state.nodes, clone],
        isSynced: false,
      };
    }),

  addDirectNode: ({ parentNodeId, parentHandle, recommendedType }) =>
    set((state) => {
      const parentNode = state.nodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return state;

      const newNode = createNode(recommendedType, parentNode.position.x + (Math.random() * 20 - 10), parentNode.position.y + 150);
      const newEdge = createCustomEdge(parentNodeId, newNode.id, parentHandle);

      return {
        nodes: [...state.nodes, newNode],
        edges: [...state.edges, newEdge],
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
      if (!edge) return state;

      const sourceNode = state.nodes.find((n) => n.id === edge.source);
      const targetNode = state.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return state;

      const newPlaceholder = createInsertPlaceholderNode(
        edge.source,
        edge.sourceHandle,
        edge.target,
        sourceNode.position.x,
        sourceNode.position.y,
        targetNode.position.x,
        targetNode.position.y
      );

      const [edge1, edge2] = createInsertPlaceholderEdges(edge, newPlaceholder.id);

      const nextEdges = state.edges.filter((e) => e.id !== edgeId).concat(edge1, edge2);

      return {
        nodes: [...state.nodes, newPlaceholder],
        edges: nextEdges,
        isSynced: false,
      };
    }),

  onNodesChange: (changes) =>
    set((state) => {
      const safeChanges = changes.filter((c) => !(c.type === "remove" && c.id === "start-1"));
      const isMutation = safeChanges.some((c) => c.type === 'remove' || c.type === 'position' || c.type === 'select');
      // @ts-ignore
      return {
        nodes: applyNodeChanges(safeChanges, state.nodes as any) as AppNode[],
        isSynced: isMutation ? false : state.isSynced,
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isSynced: false,
    })),

  onConnect: (connection) =>
    set((state) => {
      let edgeType: "default" | "success" | "error" | "info" | "warning" = "default";
      let edgeLabel = "Connection";

      if (connection.sourceHandle === "true") {
        edgeType = "success";
        edgeLabel = "True Path";
      } else if (connection.sourceHandle === "false") {
        edgeType = "error";
        edgeLabel = "False Path";
      } else {
        const sourceNode = state.nodes.find((node) => node.id === connection.source);
        if (sourceNode) {
          switch (sourceNode.type) {
            case "startNode": edgeType = "info"; edgeLabel = "Start Flow"; break;
            case "dataNode": edgeType = "info"; edgeLabel = "Data Flow"; break;
            case "indicatorNode": edgeType = "warning"; edgeLabel = "Signal"; break;
            case "actionNode": edgeType = "success"; edgeLabel = "Action Flow"; break;
            default: edgeType = "default"; edgeLabel = "Connection";
          }
        }
      }

      const newEdge = createCustomEdge(
        connection.source,
        connection.target,
        connection.sourceHandle,
        connection.targetHandle,
        edgeType,
        edgeLabel
      );

      return {
        isSynced: false,
        edges: addEdge(newEdge, state.edges),
      };
    }),
}));
