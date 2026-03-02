
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'
import { buildExecutionPlan, executeWorkflow, NodeRunner } from '@/lib/utils/dag'
import { getTriggerClient } from '@/lib/trigger/client'

// Real node runner using Trigger.dev tasks
class TriggerNodeRunner implements NodeRunner {
  async run(nodeId: string, nodeType: string, payload: any): Promise<any> {
    const client = getTriggerClient()
    switch (nodeType) {
      case 'llm': {
        const result = await client.runLLM({
          model: payload.model || 'gemini-1.5-flash',
          messages: [
            ...(payload.systemPrompt ? [{ role: 'system' as const, content: payload.systemPrompt }] : []),
            { role: 'user' as const, content: payload.userMessage || '' },
          ],
          images: payload.images,
          temperature: payload.temperature,
          maxTokens: payload.maxTokens,
          topP: payload.topP,
          frequencyPenalty: payload.frequencyPenalty,
          presencePenalty: payload.presencePenalty,
        })
        if (!result.success) throw new Error(result.error)
        return result.data
      }
      case 'crop': {
        const result = await client.runCropImage({
          imageUrl: payload.imageUrl,
          x: payload.x,
          y: payload.y,
          width: payload.width,
          height: payload.height,
          outputFormat: payload.outputFormat || 'jpeg',
        })
        if (!result.success) throw new Error(result.error)
        return result.data
      }
      case 'extract-frame': {
        const result = await client.runExtractFrame({
          videoUrl: payload.videoUrl,
          timestamp: payload.timestamp,
          outputFormat: payload.outputFormat || 'jpeg',
        })
        if (!result.success) throw new Error(result.error)
        return result.data
      }
      case 'text':
      case 'image':
      case 'video':
        // Pass-through nodes
        return payload
      default:
        throw new Error(`Unsupported node type: ${nodeType}`)
    }
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id: workflowId } = await params

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
  })
  if (!workflow) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as any[]) : []
  const edges = Array.isArray(workflow.edges) ? (workflow.edges as any[]) : []

  const plan = buildExecutionPlan(nodes, edges)

  const startedAt = new Date()
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      userId,
      status: 'running',
      nodes: {},
      results: null,
      trigger: 'manual',
      scope: 'full',
      nodeIds: [],
      startedAt,
    },
  })

  // Initialize ExecutionHistory entry (will be updated as nodes run)
  const history = await prisma.executionHistory.create({
    data: {
      userId,
      workflowId: workflow.id,
      executionId: execution.id,
      name: workflow.name,
      description: workflow.description,
      status: 'running',
      trigger: 'manual',
      scope: 'full',
      nodes: {},
      results: null,
      executionTime: null,
      completedAt: null,
    },
  })

  const runner = new TriggerNodeRunner()
  const nodeStates: Record<string, any> = {}

  // Per-node update handler
  async function onNodeUpdate(nodeId: string, status: string, result?: any, error?: string) {
    const node = nodes.find(n => n.id === nodeId)
    const label = node?.data?.label || nodeId
    const now = new Date()
    nodeStates[nodeId] = {
      label,
      status,
      output: result,
      error,
      startedAt: now,
      completedAt: status === 'completed' || status === 'failed' ? now : undefined,
      executionTime: status === 'completed' || status === 'failed' ? 0 : undefined,
    }

    // Persist per-node snapshot
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: { nodes: nodeStates },
    })

    await prisma.executionHistory.update({
      where: { id: history.id },
      data: { nodes: nodeStates },
    })
  }

  try {
    const { results, errors, status } = await executeWorkflow({
      plan,
      nodes,
      edges,
      runner,
      onUpdate: onNodeUpdate,
      concurrency: 4,
    })

    const completedAt = new Date()
    const executionTime = completedAt.getTime() - startedAt.getTime()

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status,
        nodes: nodeStates,
        results,
        completedAt,
        executionTime,
      },
    })

    await prisma.executionHistory.update({
      where: { id: history.id },
      data: {
        status,
        nodes: nodeStates,
        results,
        completedAt,
        executionTime,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        executionId: execution.id,
        status,
        results,
        errors,
      },
    })
  } catch (err) {
    const completedAt = new Date()
    const executionTime = completedAt.getTime() - startedAt.getTime()
    const status = 'failed'

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status,
        nodes: nodeStates,
        results: null,
        completedAt,
        executionTime,
      },
    })

    await prisma.executionHistory.update({
      where: { id: history.id },
      data: {
        status,
        nodes: nodeStates,
        results: null,
        completedAt,
        executionTime,
      },
    })

    return NextResponse.json(
      { success: false, error: 'Execution failed', details: String(err) },
      { status: 500 }
    )
  }
}
