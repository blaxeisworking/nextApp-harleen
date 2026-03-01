'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Scissors, Image as ImageIcon, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/helpers'

interface CropNodeData {
  label: string
  type: string
  config: {
    imageUrl: string
    x: number
    y: number
    width: number
    height: number
  }
  outputs?: {
    imageUrl: string
  }
  isExecuting?: boolean
}

interface CropNodeProps {
  id: string
  data: CropNodeData
  selected?: boolean
}

function CropNode({ id, data, selected }: CropNodeProps) {
  const { setNodes, getNode } = useReactFlow()
  const [isExecuting, setIsExecuting] = useState(false)

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...n.data.config,
                  [key]: value,
                },
              },
            }
          }
          return n
        })
      )
    },
    [id, setNodes]
  )

  const handleExecute = useCallback(async () => {
    setIsExecuting(true)
    
    // Mock execution - will integrate with FFmpeg via Trigger.dev later
    setTimeout(() => {
      const mockImageUrl = 'https://example.com/cropped-image.jpg'
      
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                outputs: {
                  imageUrl: mockImageUrl,
                },
                isExecuting: false,
              },
            }
          }
          return n
        })
      )
      
      setIsExecuting(false)
    }, 2000)
  }, [id, setNodes])

  return (
    <div
      className={cn(
        "w-80 bg-krea-node border-2 rounded-xl shadow-lg transition-all duration-200",
        selected ? "border-yellow-500 shadow-yellow-500/20" : "border-krea-node-border",
        isExecuting && "animate-pulse-glow border-yellow-500"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border bg-yellow-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="font-semibold text-sm text-krea-text-primary">Crop Image</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExecute}
            disabled={isExecuting || !data.config.imageUrl}
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
            onClick={() => {
              setNodes((nds) => nds.filter((n) => n.id !== id))
            }}
            className="h-6 w-6 hover:bg-krea-accent hover:text-krea-error"
          >
            <Scissors className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4 space-y-3">
        {/* Image Preview */}
        {data.config.imageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-krea-text-muted">Input Image</span>
            </div>
            
            <img
              src={data.config.imageUrl}
              alt="Input image"
              className="w-full h-32 object-cover rounded-lg border border-krea-node-border"
            />
          </div>
        )}

        {/* Crop Parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">X Position (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={data.config.x || 0}
              onChange={(e) => handleParamChange('x', parseInt(e.target.value) || 0)}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">Y Position (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={data.config.y || 0}
              onChange={(e) => handleParamChange('y', parseInt(e.target.value) || 0)}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">Width (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={data.config.width || 100}
              onChange={(e) => handleParamChange('width', parseInt(e.target.value) || 100)}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">Height (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={data.config.height || 100}
              onChange={(e) => handleParamChange('height', parseInt(e.target.value) || 100)}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
        </div>

        {/* Output Preview */}
        {data.outputs?.imageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-krea-success" />
              <span className="text-xs font-medium text-krea-text-muted">Cropped Output</span>
            </div>
            
            <img
              src={data.outputs.imageUrl}
              alt="Cropped image"
              className="w-full h-32 object-cover rounded-lg border border-krea-node-border"
            />
          </div>
        )}
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="image-url"
        className="!bg-yellow-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '25%' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="x-percent"
        className="!bg-yellow-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '50%' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="y-percent"
        className="!bg-yellow-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '75%' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="crop-output"
        className="!bg-yellow-500 !border-2 !border-white !w-3 !h-3"
        style={{ right: -8, top: '50%' }}
      />
    </div>
  )
}

export default CropNode