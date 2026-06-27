import type { Edge } from "@xyflow/react";
import type { AppNode, CanvasPayload } from "@/types/strategy-builder";


/**
 * Initializes and sanitizes canvas data from the backend into typed React Flow elements.
 * Strips out legacy nodes (like riskManagementNode) that are no longer valid in V4.1.
 */
export function parseCanvasPayload(canvasJson: Partial<CanvasPayload>): { nodes: AppNode[]; edges: Edge[] } {
  let rawNodes = (canvasJson.nodes ?? []) as any[];
  let rawEdges = (canvasJson.edges ?? []) as Edge[];

  // Fallback if empty
  if (rawNodes.length === 0) {
    rawNodes = [
      {
        id: "start-1",
        type: "startNode",
        position: { x: 400, y: 50 },
        deletable: false,
        data: { label: "Start Strategy", isActive: false, exchange: "delta" },
      },
    ];
  }



  // Enforce types and positions
  const parsedNodes: AppNode[] = rawNodes.map((n, idx) => {
    const position = n.position || { x: 400, y: 50 + (idx * 150) };
    const base = { ...n, position } as AppNode;
    return base.id === "start-1" ? { ...base, deletable: false } : base;
  });

  return { nodes: parsedNodes, edges: rawEdges };
}
