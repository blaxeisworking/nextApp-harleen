'use client'

import { memo, useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import { X, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'

interface NodeWrapperProps {
  id: string
  type: string
  label: string
  color?: string
  children: React.ReactNode
  isExecuting?: boolean
  onExecute?: () => void
}

function NodeWrapper({ 
  id, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type: _type, 
  label, 
  color = '#6366f1',
  children,
  isExecuting = false,
  onExecute,
}: NodeWrapperProps) {
  const { selectedNodes, removeNode } = useWorkflowStore()
  const isSelected = selectedNodes.includes(id)

  const handleDelete = useCallback(() => {
    removeNode(id)
  }, [id, removeNode])

  return (
    <div
      className={cn(
        "w-72 bg-krea-node border-2 rounded-xl shadow-lg transition-all duration-200",
        isSelected ? "border-krea-primary shadow-krea-primary/20" : "border-krea-node-border",
        isExecuting && "animate-pulse-glow border-krea-primary"
      )}
      style={{ borderColor: isSelected || isExecuting ? color : undefined }}
    >
      {/* Node Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border"
        style={{ backgroundColor: `${color}20` }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-sm text-krea-text-primary">{label}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {onExecute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExecute}
              disabled={isExecuting}
              className="h-6 w-6 hover:bg-krea-accent"
            >
              {isExecuting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-6 w-6 hover:bg-krea-accent hover:text-krea-error"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4">
        {children}
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-krea-primary !border-2 !border-white !w-3 !h-3"
        style={{ top: -6 }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-krea-primary !border-2 !border-white !w-3 !h-3"
        style={{ bottom: -6 }}
      />
    </div>
  )
}

export default memo(NodeWrapper)