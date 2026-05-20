import React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react'
import { useTheme } from 'next-themes'

interface CustomEdgeData {
  label?: string
  animated?: boolean
  type?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

type CustomEdgeProps = EdgeProps & {
  data?: CustomEdgeData
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
  selected
}: CustomEdgeProps) {
  const { label } = data || {}
  const {theme} = useTheme()
  
  // Use primary color when selected, otherwise use default theme colors
  const primaryColor = theme === "dark" ? "#145DFB" : "#145DFB" // Blue primary
  const defaultStrokeColor = theme === "dark" ? "#46474A" : "#CCCFD1"
  const strokeColor = selected ? primaryColor : defaultStrokeColor

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    borderRadius: 20,
  })

  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="30"
          markerHeight="30"
          viewBox="-15 -15 30 30"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
          refX="0"
          refY="0"
        >
          <polyline
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={"1.5"}
            fill="none"
            points="-10,-10 0,0 -10,10"
          />
        </marker>
      </defs>

      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: 1,
          stroke: strokeColor,
          ...style,
        }}
        markerEnd={`url(#arrow-${id})`}
      />

      {/* Professional label with exact edge color matching */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 11,
              fontWeight: 600,
              pointerEvents: 'all',
              backgroundColor: selected 
                ? `${strokeColor}15` // 15% opacity of stroke color
                : theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: selected 
                ? `${strokeColor}50` // 50% opacity of stroke color  
                : theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)',
              color: selected 
                ? strokeColor 
                : theme === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)',
            }}
            className="px-3 py-1.5 rounded-full shadow-sm border backdrop-blur-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
