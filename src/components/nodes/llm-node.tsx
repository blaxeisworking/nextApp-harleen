'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Bot, Sparkles, ImageIcon, Trash2, Loader2, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'
import { generateId } from '@/lib/utils/helpers'
import type { WorkflowExecution } from '@/types/workflow.types'

interface LLMNodeData {
  label: string
  type: string
  config: {
    model: string
    systemPrompt?: string
    userMessage?: string
    images?: string[]
    temperature?: number
    maxTokens?: number
  }
  outputs?: {
    text?: string
  }
  isExecuting?: boolean
  error?: string
}

interface LLMNodeProps {
  id: string
  data: LLMNodeData
  selected?: boolean
}

function LLMNode({ id, data, selected }: LLMNodeProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const {
    workflow,
    edges,
    saveWorkflow,
    loadExecutionHistory,
    updateNode,
    removeNode,
    startExecution,
    updateExecution,
    endExecution,
  } = useWorkflowStore()

  // Sync output with node data
  const output = data.outputs?.text

  const hasUserMessageInput =
    (edges || []).some((e) => e.target === id && e.targetHandle === 'user-message')

  const handleModelChange = useCallback(
    (model: string) => {
      updateNode(id, {
        config: {
          ...(data.config ?? {}),
          model,
        },
      })
    },
    [id, updateNode, data.config]
  )

  const handleSystemPromptChange = useCallback(
    (value: string) => {
      updateNode(id, {
        config: {
          ...(data.config ?? {}),
          systemPrompt: value,
        },
      })
    },
    [id, updateNode, data.config]
  )

  const handleUserMessageChange = useCallback(
    (value: string) => {
      updateNode(id, {
        config: {
          ...(data.config ?? {}),
          userMessage: value,
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
    const workflowName = workflow?.name
    const workflowDescription = workflow?.description

    const runningExecution: WorkflowExecution = {
      id: executionId,
      workflowId,
      userId: workflow?.userId ?? '',
      name: workflowName,
      description: workflowDescription,
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
        console.warn('saveWorkflow failed; executing LLM node without persistence', err)
      }

      const wf = useWorkflowStore.getState().workflow
      // The canvas can be used before a workflow is saved/loaded.
      // Use a stable fallback id so the execute API can still run in DB-less mode.
      const workflowIdForRun = wf?.id || workflowId || 'local-workflow'

      const state = useWorkflowStore.getState()
      const nodeForRun = state.nodes.find((n) => n.id === id)
      if (!nodeForRun) throw new Error('Node not found')

      // Include upstream nodes/edges so connected Text/Image nodes feed into this LLM node.
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
        throw new Error(text || 'Failed to execute LLM node')
      }

      const json = await res.json().catch(() => null)

      if (json?.success === false) {
        const details = json?.details ? `: ${String(json.details)}` : ''
        throw new Error(`${json?.error || 'Execution failed'}${details}`)
      }

      const nodeError = json?.data?.errors?.[id]
      if (nodeError) {
        throw new Error(String(nodeError))
      }

      const result = json?.data?.results?.[id]
      const text =
        typeof result === 'string'
          ? result
          : result?.text ?? result?.output?.text ?? result?.content ?? ''

      if (!text) {
        throw new Error('No text returned from LLM')
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
            output: text,
            executionTime,
            startedAt,
            completedAt,
          },
        },
      })
      endExecution()

      updateNode(id, {
        outputs: { text: String(text) },
        isExecuting: false,
        error: undefined,
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

      updateNode(id, { isExecuting: false, error: message })
      if (typeof window !== 'undefined') alert(message)
    } finally {
      // Best-effort refresh history for the right sidebar.
      await loadExecutionHistory().catch(() => {})
      setIsExecuting(false)
    }
  }, [
    id,
    workflow?.id,
    workflow?.name,
    workflow?.description,
    saveWorkflow,
    loadExecutionHistory,
    startExecution,
    updateExecution,
    endExecution,
    updateNode,
  ])

  const handleClearOutput = useCallback(() => {
    updateNode(id, { outputs: undefined })
  }, [id, updateNode])

  return (
    <div
      className={cn(
        "w-96 bg-krea-node border-2 rounded-xl shadow-lg transition-all duration-200",
        selected ? "border-orange-500 shadow-orange-500/20" : "border-krea-node-border",
        isExecuting && "animate-pulse-glow border-orange-500"
      )}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-krea-node-border bg-orange-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="font-semibold text-sm text-krea-text-primary">Run Any LLM</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExecute}
            disabled={isExecuting || (!data.config.userMessage && !hasUserMessageInput)}
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
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-4 space-y-3">
        {/* Model Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-krea-text-muted">Model</span>
          </div>
          
          <select
            value={data.config.model || 'gemini-1.5-flash'}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full bg-krea-surface border border-krea-node-border rounded-md px-3 py-2 text-krea-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-pro">Gemini Pro</option>
            <option value="gemini-pro-vision">Gemini Pro Vision</option>
          </select>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-krea-text-muted">System Prompt</span>
            </div>
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </div>
          
          <Textarea
            value={data.config.systemPrompt || ''}
            onChange={(e) => handleSystemPromptChange(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="min-h-[60px] bg-krea-surface border-krea-node-border text-krea-text-primary text-sm resize-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* User Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-krea-text-muted">User Message</span>
            </div>
            <Badge variant="destructive" className="text-xs">Required</Badge>
          </div>
          
          <Textarea
            value={data.config.userMessage || ''}
            onChange={(e) => handleUserMessageChange(e.target.value)}
            placeholder="Enter your prompt here..."
            className="min-h-[80px] bg-krea-surface border-krea-node-border text-krea-text-primary text-sm resize-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Output Section */}
        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-krea-success" />
                <span className="text-xs font-medium text-krea-text-muted">Output</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearOutput}
                className="h-6 w-6 hover:bg-krea-accent hover:text-krea-error"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="p-3 bg-krea-surface border border-krea-node-border rounded-lg">
              <p className="text-sm text-krea-text-primary">{output}</p>
            </div>
          </div>
        )}

        {/* Image Input Indicator */}
        <div className="flex items-center gap-2 text-xs text-krea-text-muted">
          <ImageIcon className="w-3 h-3" />
          <span>Connect image nodes to left handle for vision support</span>
        </div>
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="system-prompt"
        isConnectable={true}
        className="!bg-orange-500 !border-2 !border-white !w-4 !h-4 !pointer-events-auto"
        style={{ left: -14, top: '25%', zIndex: 50, pointerEvents: 'auto' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="user-message"
        isConnectable={true}
        className="!bg-orange-500 !border-2 !border-white !w-4 !h-4 !pointer-events-auto"
        style={{ left: -14, top: '50%', zIndex: 50, pointerEvents: 'auto' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        isConnectable={true}
        className="!bg-orange-500 !border-2 !border-white !w-4 !h-4 !pointer-events-auto"
        style={{ left: -14, top: '75%', zIndex: 50, pointerEvents: 'auto' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="llm-output"
        isConnectable={true}
        className="!bg-orange-500 !border-2 !border-white !w-4 !h-4 !pointer-events-auto"
        style={{ right: -14, top: '50%', zIndex: 50, pointerEvents: 'auto' }}
      />
    </div>
  )
}

export default memo(LLMNode)