'use client'

import { useCallback, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  addEdge,
} from '@xyflow/react'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { validateConnection, wouldCreateCycle, getConnectionColor } from '@/lib/utils/connections'
import TextNode from '@/components/nodes/text-node'
import ImageNode from '@/components/nodes/image-node'
import VideoNode from '@/components/nodes/video-node'
import LLMNode from '@/components/nodes/llm-node'
import CropNode from '@/components/nodes/crop-node'
import ExtractFrameNode from '@/components/nodes/extract-frame-node'
import CustomEdge from '@/components/workflow/custom-edge'
import '@xyflow/react/dist/style.css'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

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

export default function WorkflowsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setEdges,
  } = useWorkflowStore()

  useKeyboardShortcuts()

  // Remove use of safeNodes/safeEdges in the dependency array and callback.
  // Instead, always get the latest nodes/edges from the store inside the callback.
  const handleConnect = useCallback(
    (connection: Connection) => {
      // Always get the latest nodes/edges from the store
      const currentNodes = Array.isArray(useWorkflowStore.getState().nodes) ? useWorkflowStore.getState().nodes : []
      const currentEdges = Array.isArray(useWorkflowStore.getState().edges) ? useWorkflowStore.getState().edges : []

      const sourceNode = currentNodes.find((n) => n.id === connection.source)
      const targetNode = currentNodes.find((n) => n.id === connection.target)

      if (!sourceNode || !targetNode) {
        return
      }

      const validation = validateConnection(
        sourceNode.type,
        targetNode.type,
        connection.sourceHandle || '',
        connection.targetHandle || ''
      )

      if (!validation.isValid) {
        return
      }

      if (wouldCreateCycle(
        connection.source || '',
        connection.target || '',
        currentNodes,
        currentEdges
      )) {
        return
      }

      const edgeColor = getConnectionColor(validation.rule?.type || 'text')

      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'custom',
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
        animated: true,
        markerEnd: {
          type: 'arrowclosed',
          color: edgeColor,
          width: 20,
          height: 20,
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-krea-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-krea-primary rounded-lg mx-auto mb-4 animate-pulse"></div>
          <p className="text-krea-text-muted">Loading workflows...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-krea-background">
      <ReactFlow
        nodes={Array.isArray(nodes) ? nodes : []}
        edges={Array.isArray(edges) ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'custom',
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          animated: true,
        }}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        connectionLineType="bezier"
        connectionRadius={10}
      >
        <Background color="#2a2a2a" gap={20} size={1} />
        <Controls className="bg-krea-surface border border-krea-border rounded-lg" />
        <MiniMap
          className="bg-krea-surface border border-krea-border rounded-lg"
          maskColor="rgba(99, 102, 241, 0.3)"
          nodeColor="#6366f1"
        />
      </ReactFlow>
    </div>
  )
}