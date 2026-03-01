'use client'

import { memo, useCallback, useRef, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Video, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/helpers'

interface VideoNodeData {
  label: string
  type: string
  value: string
  fileName?: string
  fileSize?: number
  isExecuting?: boolean
}

interface VideoNodeProps {
  id: string
  data: VideoNodeData
  selected?: boolean
}

function VideoNode({ id, data, selected }: VideoNodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { setNodes } = useReactFlow()

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file')
        return
      }

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                value: URL.createObjectURL(file),
                fileName: file.name,
                fileSize: file.size,
              },
            }
          }
          return n
        })
      )
    },
    [id, setNodes]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      
      const file = event.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleClear = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              value: '',
              fileName: undefined,
              fileSize: undefined,
            },
          }
        }
        return n
      })
    )
  }, [id, setNodes])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div
      className={cn(
        "w-72 bg-krea-node border-2 rounded-xl shadow-lg transition-all duration-200",
        selected ? "border-pink-500 shadow-pink-500/20" : "border-krea-node-border"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border bg-pink-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="font-semibold text-sm text-krea-text-primary">Upload Video</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setNodes((nds) => nds.filter((n) => n.id !== id))
          }}
          className="h-6 w-6 hover:bg-krea-accent hover:text-krea-error"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Node Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-pink-500" />
          <span className="text-xs font-medium text-krea-text-muted">Video Upload</span>
        </div>

        {!data.value ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging 
                ? "border-pink-500 bg-pink-500/10" 
                : "border-krea-node-border hover:border-pink-500/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-krea-text-muted mx-auto mb-2" />
            <p className="text-sm text-krea-text-primary">Drop video here or click to upload</p>
            <p className="text-xs text-krea-text-muted mt-1">MP4, MOV, WEBM (max 100MB)</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-krea-node-border bg-black">
            <video
              src={data.value}
              controls
              className="w-full h-40"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-krea-error text-white rounded-full hover:bg-krea-error/80 transition-colors"
              aria-label="Remove video"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-2 bg-krea-surface">
              <p className="text-xs text-krea-text-primary truncate">{data.fileName}</p>
              <p className="text-xs text-krea-text-muted">{formatFileSize(data.fileSize || 0)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="video-target"
        className="!bg-pink-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '50%' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="video-output"
        className="!bg-pink-500 !border-2 !border-white !w-3 !h-3"
        style={{ right: -8, top: '50%' }}
      />
    </div>
  )
}

export default memo(VideoNode)