
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'
import { updateWorkflowSchema } from '@/lib/validations/workflow-schemas'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId },
  })

  if (!workflow) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: workflow })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const json = await req.json().catch(() => null)
  const parsed = updateWorkflowSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    )
  }

  const updated = await prisma.workflow.updateMany({
    where: { id, userId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
      ...(parsed.data.nodes !== undefined ? { nodes: parsed.data.nodes } : {}),
      ...(parsed.data.edges !== undefined ? { edges: parsed.data.edges } : {}),
    },
  })

  if (updated.count === 0) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const workflow = await prisma.workflow.findFirst({ where: { id, userId } })
  return NextResponse.json({ success: true, data: workflow })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const deleted = await prisma.workflow.deleteMany({
    where: { id, userId },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
