'use client'

import { memo, useCallback, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'

interface ImageNodeData {
  label: string
  type: string
  value: string
  fileName?: string
  fileSize?: number
  isExecuting?: boolean
}

interface ImageNodeProps {
  id: string
  data: ImageNodeData
  selected?: boolean
}

function ImageNode({ id, data, selected }: ImageNodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const updateNode = useWorkflowStore((s) => s.updateNode)
  const removeNode = useWorkflowStore((s) => s.removeNode)
  
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setIsUploading(true)
      updateNode(id, {
        isExecuting: true,
        fileName: file.name,
        fileSize: file.size,
      })

      try {
        const form = new FormData()
        form.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: form,
        })

        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.success || !json?.data?.url) {
          const message = json?.error || 'Failed to upload image'
          throw new Error(message)
        }

        // Store the server URL so backend workflows can access it.
        updateNode(id, {
          value: json.data.url as string,
          isExecuting: false,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        alert(message)
        updateNode(id, {
          isExecuting: false,
        })
      } finally {
        setIsUploading(false)
      }
    },
    [id, updateNode]
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
    updateNode(id, {
      value: '',
      fileName: undefined,
      fileSize: undefined,
    })
  }, [id, updateNode])

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
        selected ? "border-purple-500 shadow-purple-500/20" : "border-krea-node-border"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border bg-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="font-semibold text-sm text-krea-text-primary">Upload Image</span>
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
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-krea-text-muted">Image Upload</span>
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
                ? "border-purple-500 bg-purple-500/10" 
                : "border-krea-node-border hover:border-purple-500/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-krea-text-muted animate-spin" />
                <p className="text-sm text-krea-text-primary">Uploading…</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-krea-text-muted mx-auto mb-2" />
                <p className="text-sm text-krea-text-primary">Drop image here or click to upload</p>
                <p className="text-xs text-krea-text-muted mt-1">JPG, PNG, WEBP, GIF (max 10MB)</p>
              </>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              disabled={isUploading}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-krea-node-border">
            <img
              src={data.value}
              alt={data.fileName || 'Uploaded image'}
              className="w-full h-40 object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-krea-error text-white rounded-full hover:bg-krea-error/80 transition-colors"
              aria-label="Remove image"
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
        id="image-target"
        className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '50%' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="image-output"
        className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
        style={{ right: -8, top: '50%' }}
      />
    </div>
  )
}

export default memo(ImageNode)