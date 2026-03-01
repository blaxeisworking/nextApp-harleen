'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Film, Video, Loader2, Play, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'

interface ExtractFrameNodeData {
  label: string
  type: string
  config: {
    videoUrl: string
    timestamp: string | number
  }
  outputs?: {
    imageUrl: string
  }
  isExecuting?: boolean
}

interface ExtractFrameNodeProps {
  id: string
  data: ExtractFrameNodeData
  selected?: boolean
}

function ExtractFrameNode({ id, data, selected }: ExtractFrameNodeProps) {
  const updateNode = useWorkflowStore((s) => s.updateNode)
  const removeNode = useWorkflowStore((s) => s.removeNode)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleTimestampChange = useCallback(
    (value: string) => {
      updateNode(id, {
        config: {
          ...data.config,
          timestamp: value,
        },
      })
    },
    [id, updateNode, data.config]
  )

  const handleExecute = useCallback(async () => {
    setIsExecuting(true)
    setTimeout(() => {
      const mockImageUrl = 'https://example.com/extracted-frame.jpg'
      updateNode(id, {
        outputs: { imageUrl: mockImageUrl },
        isExecuting: false,
      })
      setIsExecuting(false)
    }, 2000)
  }, [id, updateNode])

  return (
    <div
      className={cn(
        "w-80 bg-krea-node border-2 rounded-xl shadow-lg transition-all duration-200",
        selected ? "border-cyan-500 shadow-cyan-500/20" : "border-krea-node-border",
        isExecuting && "animate-pulse-glow border-cyan-500"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border bg-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="font-semibold text-sm text-krea-text-primary">Extract Frame</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExecute}
            disabled={isExecuting || !data.config.videoUrl}
            className="h-6 w-6 hover:bg-krea-accent"
          >
            {isExecuting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeNode(id)}
            className="h-6 w-6 hover:bg-krea-accent hover:text-krea-error"
          >
            <Film className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4 space-y-3">
        {/* Video Preview */}
        {data.config.videoUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-medium text-krea-text-muted">Input Video</span>
            </div>
            
            <video
              src={data.config.videoUrl}
              controls
              className="w-full h-32 rounded-lg border border-krea-node-border bg-black"
            />
          </div>
        )}

        {/* Timestamp Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-medium text-krea-text-muted">Timestamp</span>
            </div>
            <Badge variant="secondary" className="text-xs">Seconds or %</Badge>
          </div>
          
          <Input
            type="text"
            value={data.config.timestamp || '0'}
            onChange={(e) => handleTimestampChange(e.target.value)}
            placeholder="50% or 10 (seconds)"
            className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm"
          />
          
          <p className="text-xs text-krea-text-muted">
            Use "50%" for middle of video, or number for seconds
          </p>
        </div>

        {/* Output Preview */}
        {data.outputs?.imageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-krea-success" />
              <span className="text-xs font-medium text-krea-text-muted">Extracted Frame</span>
            </div>
            
            <img
              src={data.outputs.imageUrl}
              alt="Extracted frame"
              className="w-full h-32 object-cover rounded-lg border border-krea-node-border"
            />
          </div>
        )}
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="video-url"
        className="!bg-cyan-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '30%' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="timestamp"
        className="!bg-cyan-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '70%' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="frame-output"
        className="!bg-cyan-500 !border-2 !border-white !w-3 !h-3"
        style={{ right: -8 }}
      />
    </div>
  )
}

export default ExtractFrameNode