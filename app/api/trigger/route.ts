import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getTriggerClient } from '@/lib/trigger/client'
import { LLMTaskPayload, CropImageTaskPayload, ExtractFrameTaskPayload } from '@/types/trigger.types'

/**
 * Create and run a Trigger.dev task.
 * POST /api/trigger
 * Body: { type: 'llm' | 'crop-image' | 'extract-frame', payload: {...} }
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.type || !body.payload) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const { type, payload } = body

  try {
    const client = getTriggerClient()
    let result

    switch (type) {
      case 'llm': {
        const llmPayload: LLMTaskPayload = {
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
        }
        result = await client.runLLM(llmPayload)
        break
      }
      case 'crop-image': {
        const cropPayload: CropImageTaskPayload = {
          imageUrl: payload.imageUrl,
          x: payload.x,
          y: payload.y,
          width: payload.width,
          height: payload.height,
          outputFormat: payload.outputFormat || 'jpeg',
        }
        result = await client.runCropImage(cropPayload)
        break
      }
      case 'extract-frame': {
        const framePayload: ExtractFrameTaskPayload = {
          videoUrl: payload.videoUrl,
          timestamp: payload.timestamp,
          outputFormat: payload.outputFormat || 'jpeg',
        }
        result = await client.runExtractFrame(framePayload)
        break
      }
      default:
        return NextResponse.json({ success: false, error: 'Unsupported task type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}