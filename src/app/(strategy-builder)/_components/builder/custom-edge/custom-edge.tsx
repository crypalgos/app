import React, { useState, useEffect } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react'
import { useTheme } from 'next-themes'
import { Plus, Trash2 } from 'lucide-react'
import { useNodesStore } from "../../../store/nodes-store"

interface CustomEdgeData {
  label?: string
  animated?: boolean
  type?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'placeholder'
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
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [tempLabel, setTempLabel] = useState(label || "")

  const deleteEdge = useNodesStore((state) => state.deleteEdge)
  const insertPlaceholderOnEdge = useNodesStore((state) => state.insertPlaceholderOnEdge)
  const updateEdgeLabel = useNodesStore((state) => state.updateEdgeLabel)
  
  const isPlaceholder = data?.type === 'placeholder'
  // Use primary color when selected, otherwise use default theme colors
  const primaryColor = "#145DFB" // Blue primary
  const defaultStrokeColor = isPlaceholder
    ? (theme === "dark" ? "#5e6064" : "#9ca3af")
    : (theme === "dark" ? "#46474A" : "#CCCFD1")
  const strokeColor = selected || isHovered ? primaryColor : defaultStrokeColor

  // Keep internal state updated when node attributes refresh
  useEffect(() => {
    setTempLabel(label || "")
  }, [label])

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

      {/* Visual path rendering with sleek hover response strokeWidth */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: isPlaceholder ? 1.5 : (isHovered || selected ? 1.2 : 1),
          stroke: strokeColor,
          strokeDasharray: isPlaceholder ? "5,5" : undefined,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          ...style,
        }}
        markerEnd={isPlaceholder ? undefined : `url(#arrow-${id})`}
      />

      {/* Thick invisible path for easy hover interaction */}
      {!isPlaceholder && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={15}
          className="cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}

      {/* Interactive floating control panel centered in middle of connection (No transition on position layout to prevent drag lag!) */}
      <EdgeLabelRenderer>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center justify-center gap-1.5 z-40"
        >
          {/* Plus (Insert Node) button: scales and fades in on hover */}
          {!isPlaceholder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                insertPlaceholderOnEdge(id);
              }}
              className={`
                size-5 rounded-full bg-white dark:bg-[#1B1D21] border border-zinc-200 dark:border-zinc-800/80
                text-zinc-500 dark:text-zinc-400 hover:text-primary hover:border-primary/50 dark:hover:border-primary/50 
                flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer
                ${isHovered || selected 
                  ? "opacity-100 scale-100 translate-x-0" 
                  : "opacity-0 scale-75 translate-x-2 pointer-events-none"}
              `}
              title="Insert node in connection"
            >
              <Plus className="size-3 stroke-[2.5px]" />
            </button>
          )}

          {/* Label (if present) - Supports double-click edit mode */}
          {label && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: selected || isHovered
                  ? `${strokeColor}15` // 15% opacity of stroke color
                  : theme === 'dark' ? 'rgba(27, 29, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: selected || isHovered
                  ? `${strokeColor}50` 
                  : theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)',
                color: selected || isHovered
                  ? strokeColor 
                  : theme === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="px-2.5 py-1 rounded-full shadow-sm border backdrop-blur-sm select-none transition-all duration-300 cursor-text"
              title="Double click to edit label"
            >
              {isEditing ? (
                <input
                  type="text"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateEdgeLabel(id, tempLabel);
                      setIsEditing(false);
                    } else if (e.key === "Escape") {
                      setTempLabel(label || "");
                      setIsEditing(false);
                    }
                  }}
                  onBlur={() => {
                    updateEdgeLabel(id, tempLabel);
                    setIsEditing(false);
                  }}
                  className="bg-transparent text-center border-b border-primary focus:border-primary outline-none px-1 text-[10px] w-20 font-bold select-all text-foreground"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span>{label}</span>
              )}
            </div>
          )}

          {/* Unobtrusive visual center indicator dot when not hovered and has no label */}
          {!label && !isPlaceholder && !(isHovered || selected) && (
            <div className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-800 transition-all duration-300 scale-100 opacity-60" />
          )}

          {/* Trash (Delete Connection) button: scales and fades in on hover */}
          {!isPlaceholder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEdge(id);
              }}
              className={`
                size-5 rounded-full bg-white dark:bg-[#1B1D21] border border-zinc-200 dark:border-zinc-800/80
                text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:border-red-500/50 dark:hover:border-red-500/50
                flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer
                ${isHovered || selected 
                  ? "opacity-100 scale-100 -translate-x-0" 
                  : "opacity-0 scale-75 -translate-x-2 pointer-events-none"}
              `}
              title="Delete connection edge"
            >
              <Trash2 className="size-3 stroke-[2.5px]" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
