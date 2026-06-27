import type { AppNode, AppPlaceholderNode } from "@/types/strategy-builder";

/**
 * Creates a new placeholder node and its connecting edge.
 */
export function createPlaceholderNode(
  sourceNodeId: string,
  handleId: string | null,
  expectedType: string,
  parentX: number,
  parentY: number
): AppPlaceholderNode {
  const placeholderId = `placeholder-${Date.now()}`;
  const x = parentX + (Math.random() * 20 - 10);
  const y = parentY + 130;

  return {
    id: placeholderId,
    type: "placeholderNode",
    position: { x, y },
    data: {
      expectedType,
      parentSourceId: sourceNodeId,
      parentSourceHandleId: handleId,
    },
  };
}

/**
 * Creates a duplicate of an existing node with an offset position.
 */
export function createDuplicateNode(sourceNode: AppNode): AppNode {
  const duplicateId = `${sourceNode.type}-${Date.now()}`;
  return {
    ...sourceNode,
    id: duplicateId,
    position: {
      x: sourceNode.position.x + 50,
      y: sourceNode.position.y + 50,
    },
    selected: false,
  } as AppNode;
}

/**
 * Creates a placeholder node used for inserting between an existing edge.
 */
export function createInsertPlaceholderNode(
  edgeSource: string,
  edgeSourceHandle: string | null | undefined,
  edgeTarget: string,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): AppPlaceholderNode {
  const placeholderId = `placeholder-${Date.now()}`;
  const x = (sourceX + targetX) / 2;
  const y = (sourceY + targetY) / 2;

  return {
    id: placeholderId,
    type: "placeholderNode",
    position: { x, y },
    data: {
      parentSourceId: edgeSource,
      parentSourceHandleId: edgeSourceHandle || null,
      originalTargetId: edgeTarget,
    },
  };
}

/**
 * Returns the recommended successor node type based on the current node type.
 * This guides the user through the recommended strategy building sequence.
 */
export function getRecommendedSuccessor(nodeType: string): string | null {
  switch (nodeType) {
    case "startNode":
      return "data";
    case "dataNode":
      return "indicator";
    case "indicatorNode":
      return "condition";
    case "conditionNode":
      return "action";
    case "actionNode":
      return "policyGroup";
    default:
      return null;
  }
}

/**
 * Factory for producing fully initialized nodes with sensible defaults.
 */
export function createNode(type: string, x: number, y: number): AppNode {
  const id = `${type}-${Date.now()}`;
  const position = { x, y };

  switch (type) {
    case "data":
      return {
        id,
        type: "dataNode",
        position,
        data: {
          label: "Data Source",
          source: "delta", // Default required to prevent full breakage
        },
      } as AppNode;

    case "indicator":
      return {
        id,
        type: "indicatorNode",
        position,
        data: {
          label: "Indicator",
        },
      } as AppNode;

    case "condition":
      return {
        id,
        type: "conditionNode",
        position,
        data: {
          label: "Condition",
        },
      } as AppNode;

    case "action":
      return {
        id,
        type: "actionNode",
        position,
        data: {
          label: "Action",
        },
      } as AppNode;

    case "policyGroup":
      return {
        id,
        type: "policyGroupNode",
        position,
        data: {
          label: "Risk Policy Group",
          policies: [],
        },
      } as AppNode;

    default:
      throw new Error(`Unsupported node type: ${type}`);
  }
}
