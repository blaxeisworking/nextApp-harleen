import { NextResponse } from 'next/server'
import { getTriggerClient } from '@/lib/trigger/client'
import { TriggerTask } from '@/types/trigger.types'

/**
 * Webhook/status endpoint for Trigger.dev task updates.
 * GET /api/trigger/[id] – poll task status
 * POST /api/trigger/[id] – receive webhook from Trigger.dev
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params
  if (!taskId) {
    return NextResponse.json({ success: false, error: 'Missing task ID' }, { status: 400 })
  }

  try {
    const client = getTriggerClient()
    const task = await client.getTask(taskId)
    return NextResponse.json({ success: true, data: task })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * Optional webhook handler if Trigger.dev sends callbacks.
 * Body should match TriggerTask shape.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params
  const body = await req.json().catch(() => null) as Partial<TriggerTask>

  if (!body || body.id !== taskId) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  // Here you could update WorkflowExecution/ExecutionHistory if you store taskId mapping
  // For now, just acknowledge
  console.log(`Trigger webhook for task ${taskId}: status=${body.status}`)
  return NextResponse.json({ success: true })
}