import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'
import sampleWorkflow from '@/data/sample-workflow.json'

/**
 * Import the sample workflow into the current user's workspace.
 * POST /api/workflows/import
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name: sampleWorkflow.name,
        description: sampleWorkflow.description,
        nodes: sampleWorkflow.nodes,
        edges: sampleWorkflow.edges,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
