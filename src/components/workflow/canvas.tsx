'use client'

import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils/helpers'
import { NODE_CONFIGS } from '@/lib/utils/constants'
import '@xyflow/react/dist/style.css'

const defaultEdgeOptions = {
  animated: true,
  style: {
    stroke: '#8b5cf6',
    strokeWidth: 2,
  },
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
        type: 'default',
        position,
        data: {
          label: NODE_CONFIGS[type as keyof typeof NODE_CONFIGS]?.label || type,
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
            maskColor="rgba(99, 102, 241, 0.3)"
            nodeColor="#6366f1"
            nodeStrokeColor="#8b5cf6"
            nodeStrokeWidth={2}
            pannable
            zoomable
          />
        )}
      </ReactFlow>
    </div>
  )
}