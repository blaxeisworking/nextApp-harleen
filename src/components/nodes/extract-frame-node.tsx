'use client'

import { useCallback, useMemo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Film, Video, Loader2, Play, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'
import { generateId } from '@/lib/utils/helpers'
import type { WorkflowExecution } from '@/types/workflow.types'

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
  const { workflow, nodes, edges, startExecution, updateExecution, endExecution, saveWorkflow } = useWorkflowStore()
  const [isExecuting, setIsExecuting] = useState(false)

  const connectedInputs = useMemo(() => {
    const incoming = edges.filter((e) => e.target === id)
    const byHandle: Record<string, unknown> = {}

    for (const edge of incoming) {
      if (!edge.targetHandle) continue
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const sourceData = sourceNode?.data as
        | {
            outputs?: Record<string, unknown>
            value?: unknown
          }
        | undefined

      const value =
        sourceData?.outputs?.videoUrl ??
        sourceData?.outputs?.url ??
        sourceData?.value

      byHandle[edge.targetHandle] = value
    }

    return byHandle
  }, [edges, nodes, id])

  const effectiveVideoUrl = (data.config?.videoUrl || connectedInputs['video-url'] || '') as string
  const timestampValue = data.config?.timestamp ?? ''

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

    const startedAt = new Date()
    const executionId = generateId('exec')
    const workflowId = workflow?.id ?? ''

    const runningExecution: WorkflowExecution = {
      id: executionId,
      workflowId,
      userId: workflow?.userId ?? '',
      name: workflow?.name,
      description: workflow?.description,
      status: 'running',
      nodes: {
        [id]: {
          status: 'running',
          startedAt,
        },
      },
      createdAt: startedAt,
      startedAt,
      trigger: 'manual',
      scope: 'single',
      nodeIds: [id],
    }

    startExecution(runningExecution)
    updateNode(id, { isExecuting: true })

    try {
      try {
        await saveWorkflow()
      } catch (err) {
        console.warn('saveWorkflow failed; executing Extract Frame node without persistence', err)
      }

      const wf = useWorkflowStore.getState().workflow
      const workflowIdForRun = wf?.id || workflowId || 'local-workflow'

      const state = useWorkflowStore.getState()
      const nodeForRun = state.nodes.find((n) => n.id === id)
      if (!nodeForRun) throw new Error('Node not found')

      const upstreamNodeIds = new Set<string>([id])
      const stack: string[] = [id]
      while (stack.length) {
        const current = stack.pop()!
        for (const edge of state.edges || []) {
          if (edge.target !== current) continue
          if (!upstreamNodeIds.has(edge.source)) {
            upstreamNodeIds.add(edge.source)
            stack.push(edge.source)
          }
        }
      }

      const nodesForRun = state.nodes.filter((n) => upstreamNodeIds.has(n.id))
      const edgesForRun = (state.edges || []).filter(
        (e) => upstreamNodeIds.has(e.source) && upstreamNodeIds.has(e.target)
      )

      const res = await fetch(`/api/workflows/${workflowIdForRun}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: { id: workflowIdForRun, name: wf?.name, description: wf?.description },
          nodes: nodesForRun,
          edges: edgesForRun,
        }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Failed to execute Extract Frame node')
      }

      const json = await res.json().catch(() => null)
      if (json?.success === false) {
        const details = json?.details ? `: ${String(json.details)}` : ''
        throw new Error(`${json?.error || 'Execution failed'}${details}`)
      }

      const nodeError = json?.data?.errors?.[id]
      if (nodeError) throw new Error(String(nodeError))

      const result = json?.data?.results?.[id]
      const imageUrl =
        typeof result === 'string'
          ? result
          : result?.imageUrl ?? result?.url ?? result?.output?.imageUrl ?? ''

      if (!imageUrl) {
        throw new Error('No image URL returned from Extract Frame')
      }

      const completedAt = new Date()
      const executionTime = completedAt.getTime() - startedAt.getTime()

      updateExecution({
        ...runningExecution,
        status: 'completed',
        completedAt,
        executionTime,
        nodes: {
          [id]: {
            status: 'completed',
            output: { imageUrl },
            executionTime,
            startedAt,
            completedAt,
          },
        },
      })
      endExecution()

      updateNode(id, {
        outputs: { imageUrl },
        isExecuting: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const completedAt = new Date()
      const executionTime = completedAt.getTime() - startedAt.getTime()

      updateExecution({
        ...runningExecution,
        status: 'failed',
        completedAt,
        executionTime,
        nodes: {
          [id]: {
            status: 'failed',
            error: message,
            executionTime,
            startedAt,
            completedAt,
          },
        },
      })
      endExecution()
      alert(message)
      updateNode(id, { isExecuting: false })
    } finally {
      setIsExecuting(false)
      // Refresh history sidebar so this run appears immediately
      useWorkflowStore.getState().loadExecutionHistory().catch(() => {})
    }
  }, [endExecution, id, saveWorkflow, startExecution, updateExecution, updateNode, workflow])

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
            disabled={isExecuting || !effectiveVideoUrl}
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
        {effectiveVideoUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-medium text-krea-text-muted">Input Video</span>
            </div>
            
            <video
              src={effectiveVideoUrl}
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
            value={String(timestampValue)}
            onChange={(e) => handleTimestampChange(e.target.value)}
            placeholder="50% or 10 (seconds)"
            className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm"
          />
          
          <p className="text-xs text-krea-text-muted">
            Use &quot;50%&quot; for middle of video, or number for seconds
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