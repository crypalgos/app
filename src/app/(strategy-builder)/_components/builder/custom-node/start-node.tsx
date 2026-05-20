import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StartNodeData {
  label?: string
  isActive?: boolean
}

interface StartNodeProps {
  data: StartNodeData
  selected?: boolean
}

export default function StartNode({ data, selected }: StartNodeProps) {
  const { label = "Start", isActive = false } = data || {}

  const handleStartClick = () => {
    // TODO: Implement start execution logic
    console.log('Starting strategy execution...')
  }

  return (
    <div className="relative">
      <div 
        className={`
          relative bg-white dark:bg-[#1B1D21] border
          rounded-xl p-4 w-80 h-24 shadow cursor-pointer
          hover:bg-gray-50 dark:hover:bg-[#1F2023] transition-colors
          ${selected 
            ? 'ring ring-primary' 
            : ''
          }
          ${isActive 
            ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10' 
            : ''
          }
        `}
        onClick={handleStartClick}
      >

        {/* Header with icon, title and badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-md flex items-center justify-center text-white
              ${isActive ? 'bg-green-500' : 'bg-green-600'}
            `}>
              <Play className="w-4 h-4" />
            </div>
            <h3 className="text-neutral-600 dark:text-neutral-200 font-medium text-sm truncate">{label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              {isActive ? "Running" : "Start"}
            </Badge>
          </div>
        </div>
      </div>

      {/* React Flow Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[10px] !h-[10px] !bg-white !border-[1.5px] !border-primary !rounded-full !left-1/2 !transform !-translate-x-1/2"
        style={{ 
          bottom: -6,
          position: 'absolute',
        }}
      />
    </div>
  )
}
