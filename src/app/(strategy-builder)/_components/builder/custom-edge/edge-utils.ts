// Edge utilities for creating consistent edge configurations
export type EdgeType = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface EdgeConfig {
  type: EdgeType
  animated?: boolean
  label?: string
}

// Helper function to create standard edge configurations
export const createEdgeData = (config: EdgeConfig) => ({
  type: 'custom' as const,
  data: {
    type: config.type,
    animated: config.animated || false,
    label: config.label,
  }
})

// Predefined edge configurations for common scenarios
export const EdgeConfigs = {
  // Data flow edges
  dataFlow: (label?: string) => createEdgeData({
    type: 'default',
    label,
  }),
  
  // Signal/trigger edges (animated)
  signal: (label?: string) => createEdgeData({
    type: 'info',
    animated: true,
    label,
  }),
  
  // Success/profitable action edges
  success: (label?: string) => createEdgeData({
    type: 'success',
    animated: true,
    label,
  }),
  
  // Error/stop-loss edges
  error: (label?: string) => createEdgeData({
    type: 'error',
    label,
  }),
  
  // Warning/risk management edges
  warning: (label?: string) => createEdgeData({
    type: 'warning',
    label,
  }),
  
  // Calculation/indicator edges
  calculation: (label?: string) => createEdgeData({
    type: 'warning',
    label,
  }),
}

// Helper function to ensure an edge has custom styling
export const ensureCustomEdge = (edge: any) => {
  if (!edge.type || edge.type !== 'custom') {
    return {
      ...edge,
      type: 'custom',
      data: {
        type: 'default',
        animated: false,
        label: edge.data?.label || undefined,
        ...edge.data
      }
    }
  }
  return edge
}

// Function to update edge styling
export const updateEdgeStyle = (edge: any, config: EdgeConfig) => ({
  ...edge,
  type: 'custom',
  data: {
    ...edge.data,
    type: config.type,
    animated: config.animated || false,
    label: config.label || edge.data?.label,
  }
})
