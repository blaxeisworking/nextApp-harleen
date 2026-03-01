'use client'

import { useCallback } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { Plus, Type, Image, Video, Bot, Scissors, Film, Search, X } from 'lucide-react'
import { useWorkflowStore } from '@/stores/workflow-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateId } from '@/lib/utils/helpers'
import { NODE_TYPES, NODE_CONFIGS } from '@/lib/utils/constants'


const NODE_TYPES_FALLBACK = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  LLM: 'llm',
  CROP: 'crop',
  EXTRACT_FRAME: 'extract-frame',
}

const nodeTypes = [
  {
    id: (NODE_TYPES?.TEXT ?? NODE_TYPES_FALLBACK.TEXT),
    label: 'Text Node',
    description: 'Simple text input with textarea',
    icon: Type,
    color: 'bg-blue-500',
    category: 'input',
  },
  {
    id: (NODE_TYPES?.IMAGE ?? NODE_TYPES_FALLBACK.IMAGE),
    label: 'Upload Image',
    description: 'Upload image file (jpg, png, webp, gif)',
    icon: Image,
    color: 'bg-purple-500',
    category: 'input',
  },
  {
    id: (NODE_TYPES?.VIDEO ?? NODE_TYPES_FALLBACK.VIDEO),
    label: 'Upload Video',
    description: 'Upload video file (mp4, mov, webm)',
    icon: Video,
    color: 'bg-pink-500',
    category: 'input',
  },
  {
    id: (NODE_TYPES?.LLM ?? NODE_TYPES_FALLBACK.LLM),
    label: 'Run Any LLM',
    description: 'Execute LLM models via Google Gemini',
    icon: Bot,
    color: 'bg-orange-500',
    category: 'processing',
  },
  {
    id: (NODE_TYPES?.CROP ?? NODE_TYPES_FALLBACK.CROP),
    label: 'Crop Image',
    description: 'Crop image using FFmpeg',
    icon: Scissors,
    color: 'bg-yellow-500',
    category: 'processing',
  },
  {
    id: (NODE_TYPES?.EXTRACT_FRAME ?? NODE_TYPES_FALLBACK.EXTRACT_FRAME),
    label: 'Extract Frame',
    description: 'Extract frame from video',
    icon: Film,
    color: 'bg-cyan-500',
    category: 'processing',
  },
]

export default function LeftSidebar() {
  const { addNode, setNodes, nodes } = useWorkflowStore()
  const { toggleSidebar } = useUIStore()

  const onAddNode = useCallback((type: string) => {
    // Use fallback if NODE_CONFIGS is undefined or missing the type
    const nodeConfig = NODE_CONFIGS?.[type as keyof typeof NODE_CONFIGS] ?? { label: type }
    const newNode = {
      id: `${type}-${generateId()}`,
      type,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      data: {
        label: nodeConfig.label,
        type,
        value: '',
        config: {},
        isExecuting: false,
      },
    }
    
    addNode(newNode)
  }, [addNode])

  const handleDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  return (
    <div className="flex flex-col h-full bg-krea-surface border-r border-krea-border">
      {/* Header */}
      <div className="p-4 border-b border-krea-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-krea-text-primary">Quick Access</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebar('left')}
            className="h-8 w-8 hover:bg-krea-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-krea-text-muted" />
          <Input
            type="text"
            placeholder="Search nodes..."
            className="pl-10 pr-4 py-2 bg-krea-node border-krea-node-border rounded-lg text-sm focus:ring-2 focus:ring-krea-primary"
          />
        </div>
      </div>

      {/* Node Types */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Input Nodes */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-krea-text-muted uppercase tracking-wider mb-3">
            Input Nodes
          </h3>
          <div className="space-y-2">
            {nodeTypes
              .filter(node => node.category === 'input')
              .map((nodeType) => {
                const Icon = nodeType.icon
                return (
                  <div
                    key={nodeType.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeType.id)}
                    onClick={() => onAddNode(nodeType.id)}
                    className="group p-3 bg-krea-node border border-krea-node-border rounded-lg hover:border-krea-primary hover:bg-krea-node-hover cursor-grab active:cursor-grabbing transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${nodeType.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-krea-text-primary group-hover:text-krea-primary transition-colors">
                          {nodeType.label}
                        </div>
                        <div className="text-xs text-krea-text-muted truncate">
                          {nodeType.description}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-krea-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Processing Nodes */}
        <div>
          <h3 className="text-xs font-semibold text-krea-text-muted uppercase tracking-wider mb-3">
            Processing Nodes
          </h3>
          <div className="space-y-2">
            {nodeTypes
              .filter(node => node.category === 'processing')
              .map((nodeType) => {
                const Icon = nodeType.icon
                return (
                  <div
                    key={nodeType.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeType.id)}
                    onClick={() => onAddNode(nodeType.id)}
                    className="group p-3 bg-krea-node border border-krea-node-border rounded-lg hover:border-krea-primary hover:bg-krea-node-hover cursor-grab active:cursor-grabbing transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${nodeType.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-krea-text-primary group-hover:text-krea-primary transition-colors">
                          {nodeType.label}
                        </div>
                        <div className="text-xs text-krea-text-muted truncate">
                          {nodeType.description}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-krea-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-krea-border">
        <div className="text-xs text-krea-text-muted text-center">
          <p>Drag nodes to canvas or click to add</p>
          <p className="mt-1">{nodes.length} nodes in workflow</p>
        </div>
      </div>
    </div>
  )
}