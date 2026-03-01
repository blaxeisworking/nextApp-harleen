'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { Bot, Sparkles, ImageIcon, Trash2, Loader2, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/helpers'
import { useWorkflowStore } from '@/stores/workflow-store'

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
}

interface LLMNodeProps {
  id: string
  data: LLMNodeData
  selected?: boolean
}

function LLMNode({ id, data, selected }: LLMNodeProps) {
  const { setNodes, getNode } = useReactFlow()
  const [isExecuting, setIsExecuting] = useState(false)
  const updateNode = useWorkflowStore((s) => s.updateNode)
  const removeNode = useWorkflowStore((s) => s.removeNode)

  // Sync output with node data
  const output = data.outputs?.text

  const handleModelChange = useCallback(
    (model: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...n.data.config,
                  model,
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

  const handleSystemPromptChange = useCallback(
    (value: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...n.data.config,
                  systemPrompt: value,
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

  const handleUserMessageChange = useCallback(
    (value: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...n.data.config,
                  userMessage: value,
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
    
    // Mock execution - will integrate with Google Gemini API later
    setTimeout(() => {
      const mockResponse = `Generated response for: ${data.config.userMessage || 'No message'}`
      
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                outputs: {
                  text: mockResponse,
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
  }, [id, setNodes, data.config.userMessage])

  const handleClearOutput = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              outputs: undefined,
            },
          }
        }
        return n
      })
    )
  }, [id, setNodes])

  const handleChange = useCallback(
    (value: string) => {
      updateNode(id, { value })
    },
    [id, updateNode]
  )

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
            disabled={isExecuting || !data.config.userMessage}
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
        className="!bg-orange-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '25%' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="user-message"
        className="!bg-orange-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '50%' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        className="!bg-orange-500 !border-2 !border-white !w-3 !h-3"
        style={{ left: -8, top: '75%' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="llm-output"
        className="!bg-orange-500 !border-2 !border-white !w-3 !h-3"
        style={{ right: -8, top: '50%' }}
      />
    </div>
  )
}

export default memo(LLMNode)