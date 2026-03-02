import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

/**
 * Upload a file and store metadata in the database.
 * POST /api/upload
 * Body: multipart/form-data with a file field
 */
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type/size (basic checks)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 })
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 10)
    const ext = path.extname(file.name)
    const filename = `${timestamp}-${random}${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Store metadata in database
    const fileRecord = await prisma.fileUpload.create({
      data: {
        userId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        url: `/uploads/${filename}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: fileRecord.id,
        filename: fileRecord.fileName,
        originalName: fileRecord.fileName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.fileSize,
        url: fileRecord.url,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}