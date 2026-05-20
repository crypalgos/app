import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { GitBranch, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ConditionNodeData {
  label?: string
  condition?: string
  isConfigured?: boolean
}

interface ConditionNodeProps {
  data: ConditionNodeData
  selected?: boolean
}

export default function ConditionNode({ data, selected }: ConditionNodeProps) {
  const { label = "Condition", condition = "Price > SMA(20)", isConfigured = true } = data || {}

  const handleCopy = () => {
    console.log('Copy node')
  }

  const handleDelete = () => {
    console.log('Delete node')
  }

  return (
    <div className="relative">
      <div className={`
        relative bg-white dark:bg-[#1B1D21] border
        rounded-xl p-4 w-80 h-24 shadow
        ${selected 
          ? 'ring ring-primary' 
          : ''
        }
      `}>

        {/* Header with icon, title and badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-neutral-600 dark:text-neutral-200 font-medium text-sm truncate">{label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Logic
            </Badge>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy node"
            >
              <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[10px] !h-[10px] !bg-white !border-[1.5px] !border-primary !rounded-full !left-1/2 !transform !-translate-x-1/2"
        style={{ 
          top: -6,
          position: 'absolute',
        }}
      />
      
      {/* True Output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-[10px] !h-[10px] !bg-white !border-[1.5px] !border-green-500 !rounded-full"
        style={{ 
          bottom: -1, 
          left: '35%',
          position: 'absolute',
        }}
      />
      
      {/* False Output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-[10px] !h-[10px] !bg-white !border-[1.5px] !border-red-500 !rounded-full"
        style={{ 
          bottom: -1, 
          left: '65%',
          position: 'absolute',
        }}
      />
    </div>
  )
}
