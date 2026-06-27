import { Node, Edge } from "@xyflow/react";

export interface CanvasValidationError {
  nodeId?: string;
  message: string;
  severity: "error" | "warning";
}

export function validateCanvas(nodes: Node[], edges: Edge[]): CanvasValidationError[] {
  const errors: CanvasValidationError[] = [];
  
  // Rule 1: Must have exactly one Start Node
  const startNodes = nodes.filter(n => n.type === "startNode");
  if (startNodes.length === 0) {
    errors.push({ message: "Canvas must contain exactly one Start Node.", severity: "error" });
  } else if (startNodes.length > 1) {
    errors.push({ message: "Canvas cannot contain multiple Start Nodes.", severity: "error" });
  }

  // Set of connected nodes
  const connectedNodes = new Set<string>();
  edges.forEach(e => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });
  
  nodes.forEach(node => {
    // Check if detached
    if (node.type !== "startNode" && !connectedNodes.has(node.id)) {
      errors.push({
        nodeId: node.id,
        message: `Node '${node.data?.label || node.id}' is disconnected from the flow.`,
        severity: "warning",
      });
    }

    // Condition Node specific rules
    if (node.type === "conditionNode") {
      const outEdges = edges.filter(e => e.source === node.id);
      if (outEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: `Condition Node '${node.data?.label || node.id}' has no downstream path connected.`,
          severity: "warning"
        });
      }
    }
    
    // Policy Group Node specific rules
    if (node.type === "policyGroupNode") {
      const inEdges = edges.filter(e => e.target === node.id);
      if (inEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: `Risk Policy Group '${node.data?.label || node.id}' must be attached downstream of an Action Node.`,
          severity: "error"
        });
      }
      
      const policies = node.data?.policies as any[];
      if (!policies || policies.length === 0) {
        errors.push({
          nodeId: node.id,
          message: `Risk Policy Group '${node.data?.label || node.id}' is empty. Add at least one policy.`,
          severity: "warning"
        });
      }
    }

    // Action Node specific rules
    if (node.type === "actionNode") {
      const actionType = node.data?.actionType;
      if (actionType === "buy" || actionType === "sell" || actionType === "short" || actionType === "cover") {
        const sizingValue = (node.data?.sizing as any)?.value ?? node.data?.sizing_value;
        if (sizingValue === undefined || sizingValue === null || sizingValue <= 0) {
          errors.push({
            nodeId: node.id,
            message: `Action Node '${node.data?.label || node.id}' has an invalid or zero sizing value.`,
            severity: "error"
          });
        }
      }
    }
    
    // Data Node specific rules
    if (node.type === "dataNode") {
      if (!node.data?.symbol) {
        errors.push({
          nodeId: node.id,
          message: `Data Node '${node.data?.label || node.id}' requires a valid trading symbol.`,
          severity: "error"
        });
      }
    }
  });

  return errors;
}
