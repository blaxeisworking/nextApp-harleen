import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'

export async function GET(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflowId') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Math.max(Number(limitParam ?? 50) || 50, 1), 200)

  const history = await prisma.executionHistory.findMany({
    where: {
      userId,
      ...(workflowId ? { workflowId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ success: true, data: history })
}
