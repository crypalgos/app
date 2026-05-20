import React from 'react'
import { getSmoothStepPath } from '@xyflow/react'
import { useTheme } from 'next-themes'

interface CustomConnectionLineProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  fromPosition: string
  toPosition: string
}

export default function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: CustomConnectionLineProps) {
  const { theme } = useTheme()
  
  // Use the same default colors as normal edges (not selected)
  const connectionColor = theme === "dark" ? "#46474A" : "#CCCFD1"

  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    borderRadius: 20,
  })

  return (
    <>
      <defs>
        <marker
          id="connection-arrow"
          markerWidth="30"
          markerHeight="30"
          viewBox="-15 -15 30 30"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
          refX="0"
          refY="0"
        >
          <polyline
            stroke={connectionColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
            fill="none"
            points="-10,-10 0,0 -10,10"
          />
        </marker>
      </defs>
      
      <g>
        <path
          d={edgePath}
          stroke={connectionColor}
          strokeWidth={0.85}
          fill="none"
          strokeDasharray="5,5"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#connection-arrow)"
          opacity={0.8}
        />
      </g>
    </>
  )
}
