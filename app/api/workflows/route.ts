
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'
import { createWorkflowSchema } from '@/lib/validations/workflow-schemas'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      tags: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ success: true, data: workflows })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = createWorkflowSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    )
  }

  const created = await prisma.workflow.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      tags: parsed.data.tags ?? [],
      nodes: parsed.data.nodes,
      edges: parsed.data.edges,
      userId,
      isPublic: false,
    },
  })

  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
