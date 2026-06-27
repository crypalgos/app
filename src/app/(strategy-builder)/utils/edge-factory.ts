import type { Edge } from "@xyflow/react";

/**
 * Ensures an edge has the required custom types and data for the builder.
 */
export function createCustomEdge(
  source: string,
  target: string,
  sourceHandle?: string | null,
  targetHandle?: string | null,
  edgeType: "default" | "success" | "error" | "info" | "warning" = "default",
  label: string = "Connection"
): Edge {
  return {
    id: `edge-${source}-${target}`,
    source,
    sourceHandle: sourceHandle || undefined,
    target,
    targetHandle: targetHandle || undefined,
    type: "custom",
    data: {
      type: edgeType,
      animated: false,
      label,
    },
  };
}

/**
 * Creates edges to connect a source node to a placeholder node.
 */
export function createPlaceholderEdge(
  source: string,
  target: string,
  sourceHandle?: string | null
): Edge {
  return createCustomEdge(source, target, sourceHandle, null, "default", "Add Node");
}

/**
 * Creates edges when a placeholder is inserted between an existing connection.
 */
export function createInsertPlaceholderEdges(
  originalEdge: Edge,
  placeholderId: string
): [Edge, Edge] {
  const edge1 = createCustomEdge(
    originalEdge.source,
    placeholderId,
    originalEdge.sourceHandle,
    null,
    "default",
    "Add Node"
  );
  
  // Keep original edge type data for the second edge if it had any.
  // Actually, we make both edges placeholder-styled initially.
  edge1.data = { ...edge1.data, type: "placeholder" };

  const edge2 = createCustomEdge(
    placeholderId,
    originalEdge.target,
    null,
    originalEdge.targetHandle,
    "default",
    "To Target"
  );
  edge2.data = { ...edge2.data, type: "placeholder" };

  return [edge1, edge2];
}
