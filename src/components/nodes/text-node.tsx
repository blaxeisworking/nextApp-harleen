'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Type, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'

interface TextNodeData {
  label: string
  type: string
  value: string
  isExecuting?: boolean
}

interface TextNodeProps {
  id: string
  data: TextNodeData
  selected?: boolean
}

function TextNode({ id, data, selected }: TextNodeProps) {
  const edges = useWorkflowStore((s) => s.edges)
  const [connectedInputs, setConnectedInputs] = useState<string[]>([])
  const updateNode = useWorkflowStore((s) => s.updateNode)
  const removeNode = useWorkflowStore((s) => s.removeNode)

  // Check for incoming connections
  useEffect(() => {
    const incomingEdges = edges?.filter(e => e.target === id) || []
    setConnectedInputs(incomingEdges.map(e => e.targetHandle || ''))
  }, [id, edges])

  const handleChange = useCallback(
    (value: string) => {
      updateNode(id, { value })
    },
    [id, updateNode]
  )

  return (
    <div
      className={cn(
        "w-72 bg-krea-node border-2 rounded-xl shadow-lg transition-all duration-200",
        selected ? "border-blue-500 shadow-blue-500/20" : "border-krea-node-border"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border bg-blue-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm text-krea-text-primary">Text Node</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeNode(id)}
          className="h-6 w-6 hover:bg-krea-accent hover:text-krea-error"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Node Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-krea-text-muted">Text Input</span>
        </div>
        
        <Textarea
          value={data.value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={connectedInputs.includes('text-target')}
          placeholder={connectedInputs.includes('text-target') ? 'Connected from another node' : 'Enter your text here...'}
          className={cn(
            "min-h-[120px] bg-krea-surface border-krea-node-border text-krea-text-primary text-sm resize-none focus:ring-2 focus:ring-blue-500",
            connectedInputs.includes('text-target') && "opacity-50 cursor-not-allowed"
          )}
        />
        
        {connectedInputs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-krea-success">
            <CheckCircle2 className="w-3 h-3" />
            <span>{connectedInputs.length} input(s) connected</span>
          </div>
        )}
        
        <div className="text-xs text-krea-text-muted text-right">
          {(data.value || '').length} characters
        </div>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="text-target"
        isConnectable={true}
        className="!bg-blue-500 !border-2 !border-white !w-4 !h-4 !pointer-events-auto"
        style={{ left: -14, top: '50%', zIndex: 50, pointerEvents: 'auto' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="text-output"
        isConnectable={true}
        className="!bg-blue-500 !border-2 !border-white !w-4 !h-4 !pointer-events-auto"
        style={{ right: -14, top: '50%', zIndex: 50, pointerEvents: 'auto' }}
      />
    </div>
  )
}

export default memo(TextNode)