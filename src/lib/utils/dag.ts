import { Node, Edge } from '@xyflow/react'

export interface ExecutionPlan {
  levels: string[][]
  totalNodes: number
}

/**
 * Compute a topological sort and execution levels for a DAG.
 * Returns levels where each level can be executed in parallel.
 */
export function buildExecutionPlan(nodes: Node[], edges: Edge[]): ExecutionPlan {
  const nodeIds = new Set(nodes.map(n => n.id))
  const inDegree: Record<string, number> = {}
  const outEdges: Record<string, string[]> = {}

  // Initialize in-degree and adjacency
  nodeIds.forEach((nodeId) => {
    inDegree[nodeId] = 0
    outEdges[nodeId] = []
  })

  // Populate in-degree and adjacency from edges
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1
    outEdges[edge.source].push(edge.target)
  }

  // Kahn's algorithm to produce levels
  const levels: string[][] = []
  const queue: string[] = []

  // Initial nodes (no incoming edges)
  nodeIds.forEach((nodeId) => {
    if (inDegree[nodeId] === 0) queue.push(nodeId)
  })

  while (queue.length > 0) {
    const currentLevel = [...queue]
    levels.push(currentLevel)
    queue.length = 0 // clear for next level

    for (const nodeId of currentLevel) {
      for (const neighbor of outEdges[nodeId]) {
        inDegree[neighbor] -= 1
        if (inDegree[neighbor] === 0) queue.push(neighbor)
      }
    }
  }

  // Detect cycles (should not happen due to UI validation, but guard)
  const totalProcessed = levels.flat().length
  if (totalProcessed !== nodeIds.size) {
    throw new Error('Cycle detected in workflow graph')
  }

  return { levels, totalNodes: nodeIds.size }
}

/**
 * Resolve input values for a node from upstream outputs.
 */
function handleIdToPayloadKey(handleId: string): string {
  // Common explicit mappings used by our node handle IDs.
  const explicit: Record<string, string> = {
    'image-url': 'imageUrl',
    'video-url': 'videoUrl',
    'system-prompt': 'systemPrompt',
    'user-message': 'userMessage',
    'x-percent': 'x',
    'y-percent': 'y',
    'width-percent': 'width',
    'height-percent': 'height',
    'top-p': 'topP',
    'max-tokens': 'maxTokens',
    'frequency-penalty': 'frequencyPenalty',
    'presence-penalty': 'presencePenalty',
  }
  if (explicit[handleId]) return explicit[handleId]

  // Default: kebab/underscore -> camelCase.
  return handleId
    .replace(/[_\-]+(.)/g, (_, ch: string) => (ch ? ch.toUpperCase() : ''))
    .replace(/[^a-zA-Z0-9]/g, '')
}

export function resolveNodeInputs(
  nodeId: string,
  edges: Edge[],
  nodeResults: Record<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {}
  const incoming = edges.filter(e => e.target === nodeId)

  for (const edge of incoming) {
    const sourceResult = nodeResults[edge.source]
    const targetHandle = edge.targetHandle

    // Map common handle types to payload fields
    const sourceObj = (sourceResult && typeof sourceResult === 'object' ? sourceResult : {}) as Record<string, unknown>
    let value: unknown = undefined
    if (sourceObj.output) {
      // Prefer explicit output if available
      value = sourceObj.output
    } else if (sourceObj.text) {
      value = sourceObj.text
    } else if (sourceObj.imageUrl) {
      value = sourceObj.imageUrl
    } else if (sourceObj.videoUrl) {
      value = sourceObj.videoUrl
    } else if (sourceObj.url) {
      value = sourceObj.url
    } else if (typeof sourceResult === 'string') {
      value = sourceResult
    } else {
      // Fallback to raw result
      value = sourceResult
    }

    // Map by target handle name (e.g. 'image-url' -> imageUrl)
    if (targetHandle) {
      const key = handleIdToPayloadKey(targetHandle)
      if (key === 'userMessage' || key === 'systemPrompt') {
        inputs[key] =
          value === undefined || value === null
            ? ''
            : typeof value === 'string'
              ? value
              : JSON.stringify(value)
      } else {
        inputs[key] = value
      }
    }
  }

  return inputs
}

/**
 * Minimal node runner that maps node type to a handler.
 * In the real implementation, these will call Trigger.dev tasks.
 */
export interface NodeRunner {
  run(nodeId: string, nodeType: string, payload: Record<string, unknown>): Promise<unknown>
}

/**
 * Execute a workflow using the DAG plan and a node runner.
 * Updates execution records per-node and returns final results.
 */
export async function executeWorkflow({
  plan,
  nodes,
  edges,
  runner,
  onUpdate,
  concurrency = 4,
}: {
  plan: ExecutionPlan
  nodes: Node[]
  edges: Edge[]
  runner: NodeRunner
  onUpdate?: (nodeId: string, status: string, result?: unknown, error?: string) => void
  concurrency?: number
}) {
  // NOTE: Keep runtime data flexible; lint enforces `unknown` instead of `any`.
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const nodeConfigs = new Map(
    nodes.map((n) => [
      n.id,
      ((n.data as unknown as { config?: unknown })?.config as Record<string, unknown> | undefined) ?? {},
    ])
  )
  const nodeResults: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  const running = new Set<string>()
  const done = new Set<string>()

  async function runNode(nodeId: string) {
    const node = nodeMap.get(nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)

    onUpdate?.(nodeId, 'running')
    try {
      const inputs = resolveNodeInputs(nodeId, edges, nodeResults)
      const nodeData = (node.data ?? {}) as unknown as Record<string, unknown>
      const baseConfig: Record<string, unknown> = { ...(nodeConfigs.get(nodeId) || {}) }

      // Pass-through nodes store their primary value in `data.value`.
      // Normalize it into type-specific fields so downstream mapping works.
      if ('value' in nodeData && nodeData.value !== undefined) {
        switch (node.type) {
          case 'text':
            baseConfig.text = nodeData.value
            break
          case 'image':
            baseConfig.imageUrl = nodeData.value
            break
          case 'video':
            baseConfig.videoUrl = nodeData.value
            break
          default:
            baseConfig.value = nodeData.value
        }
      }

      const payload = { ...baseConfig, ...inputs }
      const result = await runner.run(nodeId, node.type || '', payload)
      nodeResults[nodeId] = result
      onUpdate?.(nodeId, 'completed', result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors[nodeId] = message
      onUpdate?.(nodeId, 'failed', undefined, message)
      throw err
    } finally {
      running.delete(nodeId)
      done.add(nodeId)
    }
  }

  async function processLevel(level: string[]) {
    const promises = level.map(async (nodeId) => {
      while (running.size >= concurrency) {
        await new Promise(res => setTimeout(res, 50))
      }
      running.add(nodeId)
      return runNode(nodeId)
    })

    await Promise.allSettled(promises)
  }

  for (const level of plan.levels) {
    await processLevel(level)
  }

  return {
    results: nodeResults,
    errors,
    status: Object.keys(errors).length > 0 ? 'failed' : 'completed',
  }
}
