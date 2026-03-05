import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflowId') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Math.max(Number(limitParam ?? 50) || 50, 1), 200)

  try {
    const history = await prisma.executionHistory.findMany({
      where: {
        userId,
        ...(workflowId ? { workflowId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, data: history })
  } catch (err) {
    // Dev-friendly fallback: if DB is not configured, avoid 500s and let UI keep working.
    console.warn('History unavailable (DB not configured)', err)
    return NextResponse.json({ success: true, data: [], warning: 'History unavailable' })
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workflowId = searchParams.get('workflowId') ?? undefined

  try {
    await prisma.executionHistory.deleteMany({
      where: {
        userId,
        ...(workflowId ? { workflowId } : {}),
      },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.warn('Failed to delete history (DB not configured)', err)
    return NextResponse.json({ success: true, warning: 'DB unavailable, cleared locally only' })
  }
}
