'use client'

import { useCallback, useMemo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Scissors, Image as ImageIcon, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'
import { generateId } from '@/lib/utils/helpers'
import type { WorkflowExecution } from '@/types/workflow.types'

interface CropNodeData {
  label: string
  type: string
  config: {
    imageUrl: string
    x?: number
    y?: number
    width?: number
    height?: number
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
  const [isExecuting, setIsExecuting] = useState(false)
  const { workflow, startExecution, updateExecution, endExecution, saveWorkflow } = useWorkflowStore()
  const updateNode = useWorkflowStore((s) => s.updateNode)
  const removeNode = useWorkflowStore((s) => s.removeNode)
  const nodes = useWorkflowStore((s) => s.nodes)
  const edges = useWorkflowStore((s) => s.edges)

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

      // Prefer explicit outputs (when a node has been executed), else fall back to value.
      const value =
        sourceData?.outputs?.imageUrl ??
        sourceData?.outputs?.text ??
        sourceData?.outputs?.url ??
        sourceData?.value

      byHandle[edge.targetHandle] = value
    }

    return byHandle
  }, [edges, nodes, id])

  const effectiveImageUrl = (data.config?.imageUrl || connectedInputs['image-url'] || '') as string

  const preventWheelChange = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    // On macOS, scrolling over number inputs changes the value.
    // Blur prevents the browser from applying wheel increments.
    e.currentTarget.blur()
  }, [])

  const handleParamChange = useCallback(
    (key: string, value: number | undefined) => {
      updateNode(id, {
        config: {
          ...(data.config ?? { imageUrl: '', x: 0, y: 0, width: 100, height: 100 }),
          [key]: value,
        },
      })
    },
    [id, updateNode, data.config]
  )

  const xValue = (data.config?.x ?? (connectedInputs['x-percent'] !== undefined ? Number(connectedInputs['x-percent']) : undefined)) as
    | number
    | undefined
  const yValue = (data.config?.y ?? (connectedInputs['y-percent'] !== undefined ? Number(connectedInputs['y-percent']) : undefined)) as
    | number
    | undefined
  const widthValue = (data.config?.width ?? (connectedInputs['width-percent'] !== undefined ? Number(connectedInputs['width-percent']) : undefined)) as
    | number
    | undefined
  const heightValue = (data.config?.height ?? (connectedInputs['height-percent'] !== undefined ? Number(connectedInputs['height-percent']) : undefined)) as
    | number
    | undefined

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
      // Best-effort persist first, so we have a stable workflow id.
      try {
        await saveWorkflow()
      } catch (err) {
        console.warn('saveWorkflow failed; executing Crop node without persistence', err)
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
        throw new Error(text || 'Failed to execute Crop node')
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
        throw new Error('No image URL returned from Crop')
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
        outputs: {
          imageUrl,
        },
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
  }, [endExecution, id, saveWorkflow, startExecution, updateExecution, updateNode, workflow, workflow?.id, workflow?.userId, workflow?.name, workflow?.description])

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
            disabled={isExecuting || !effectiveImageUrl}
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
              removeNode(id)
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
        {effectiveImageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-krea-text-muted">Input Image</span>
            </div>
            
            <img
              src={effectiveImageUrl}
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
              value={xValue ?? ''}
              placeholder="0"
              onChange={(e) => {
                const v = e.target.value
                handleParamChange('x', v === '' ? undefined : Number(v))
              }}
              onWheel={preventWheelChange}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">Y Position (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={yValue ?? ''}
              placeholder="0"
              onChange={(e) => {
                const v = e.target.value
                handleParamChange('y', v === '' ? undefined : Number(v))
              }}
              onWheel={preventWheelChange}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">Width (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={widthValue ?? ''}
              placeholder="100"
              onChange={(e) => {
                const v = e.target.value
                handleParamChange('width', v === '' ? undefined : Number(v))
              }}
              onWheel={preventWheelChange}
              className="bg-krea-surface border-krea-node-border text-krea-text-primary text-sm h-8"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-krea-text-muted">Height (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={heightValue ?? ''}
              placeholder="100"
              onChange={(e) => {
                const v = e.target.value
                handleParamChange('height', v === '' ? undefined : Number(v))
              }}
              onWheel={preventWheelChange}
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