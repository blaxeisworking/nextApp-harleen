'use client'

import { useCallback, useRef, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  useKeyPress,
} from '@xyflow/react'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils/helpers'
import { validateConnection, wouldCreateCycle } from '@/lib/utils/connections'
import CustomEdge from '@/components/workflow/custom-edge'
import TextNode from '@/components/nodes/text-node'
import ImageNode from '@/components/nodes/image-node'
import VideoNode from '@/components/nodes/video-node'
import LLMNode from '@/components/nodes/llm-node'
import CropNode from '@/components/nodes/crop-node'
import ExtractFrameNode from '@/components/nodes/extract-frame-node'
import '@xyflow/react/dist/style.css'

const defaultEdgeOptions = {
  animated: true,
  style: {
    stroke: '#8b5cf6',
    strokeWidth: 2,
  },
}

const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  llm: LLMNode,
  crop: CropNode,
  'extract-frame': ExtractFrameNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    addNode,
    snapToGrid,
    gridSize,
    showMinimap,
    showControls 
  } = useWorkflowStore()

  const { theme } = useUIStore()

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')

      if (!type) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type,
          type,
          value: '',
          config: {},
          isExecuting: false,
        },
      }

      addNode(newNode)
    },
    [screenToFlowPosition, addNode]
  )

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={(connection: Connection) => {
          const source = nodes.find((n) => n.id === connection.source)
          const target = nodes.find((n) => n.id === connection.target)

          if (!source || !target) return false
          if (!connection.sourceHandle || !connection.targetHandle) return false

          const validation = validateConnection(
            source.type,
            target.type,
            connection.sourceHandle,
            connection.targetHandle
          )

          if (!validation.isValid) return false
          if (wouldCreateCycle(source.id, target.id, nodes, edges)) return false

          return true
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        fitView
        fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
        className={cn(
          "react-flow",
          theme === "dark" ? "dark" : "light"
        )}
      >
        <Background 
          color="#2a2a2a" 
          gap={gridSize} 
          size={1}
        />
        
        {showControls && (
          <Controls 
            className="bg-krea-surface border border-krea-border rounded-lg shadow-lg"
          />
        )}
        
        {showMinimap && (
          <MiniMap
            className="bg-krea-surface border border-krea-border rounded-lg shadow-lg"
            nodeColor={(node) => {
              switch (node.type) {
                case 'text': return '#3b82f6'
                case 'image': return '#10b981'
                case 'video': return '#8b5cf6'
                case 'llm': return '#f97316'
                case 'crop': return '#eab308'
                case 'extract-frame': return '#06b6d4'
                default: return '#6b7280'
              }
            }}
            nodeStrokeWidth={2}
            pannable
            zoomable
            position="bottom-right"
            style={{
              backgroundColor: 'var(--krea-surface)',
              border: '1px solid var(--krea-border)',
            }}
          />
        )}
      </ReactFlow>
    </div>
  )
}