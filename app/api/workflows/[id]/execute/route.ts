
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { Node, Edge } from '@xyflow/react'
import prisma from '@/lib/db/prisma'
import { buildExecutionPlan, executeWorkflow, NodeRunner } from '@/lib/utils/dag'
import { getTriggerClient } from '@/lib/trigger/client'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStaticPath from 'ffmpeg-static'
import ffprobePath from 'ffprobe-static'

// ffmpeg-static path may break when Next.js bundles the server route.
// Resolve it from the real node_modules location as a fallback.
function resolveFfmpegPath(): string | null {
  if (typeof ffmpegStaticPath === 'string' && ffmpegStaticPath) return ffmpegStaticPath
  try {
    // require.resolve gives the absolute path even after bundling
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require('ffmpeg-static') as string | null
    return typeof p === 'string' ? p : null
  } catch {
    return null
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

async function readUrlAsBuffer(url: string): Promise<Buffer> {
  if (!url) throw new Error('Missing input URL')

  // Support local public files: /uploads/..., /outputs/...
  if (url.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', url)
    const { readFile } = await import('fs/promises')
    return readFile(filePath)
  }

  if (!isHttpUrl(url)) {
    throw new Error(`Unsupported URL: ${url}`)
  }

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch input: ${res.status}`)
  }
  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}

async function resolveUrlToLocalFile(url: string, suggestedExt?: string): Promise<string> {
  if (!url) throw new Error('Missing input URL')

  // Local public files.
  if (url.startsWith('/')) {
    return path.join(process.cwd(), 'public', url)
  }

  if (!isHttpUrl(url)) {
    throw new Error(`Unsupported URL: ${url}`)
  }

  // Download remote inputs to a temp file for ffmpeg.
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch input: ${res.status}`)
  }
  const arr = await res.arrayBuffer()
  const buf = Buffer.from(arr)

  const tmpDir = path.join(process.cwd(), '.next', 'cache', 'tmp')
  await mkdir(tmpDir, { recursive: true })
  const ext = suggestedExt ? (suggestedExt.startsWith('.') ? suggestedExt : `.${suggestedExt}`) : ''
  const filename = `input-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const tmpPath = path.join(tmpDir, filename)
  await writeFile(tmpPath, buf)
  return tmpPath
}

async function ensureOutputsDir(): Promise<string> {
  const outputsDir = path.join(process.cwd(), 'public', 'outputs')
  await mkdir(outputsDir, { recursive: true })
  return outputsDir
}

async function runLocalCropImage(payload: Record<string, unknown>): Promise<{ imageUrl: string }> {
  const imageUrl = String(payload?.imageUrl || '')
  const xPct = Number(payload?.x ?? 0)
  const yPct = Number(payload?.y ?? 0)
  const wPct = Number(payload?.width ?? 100)
  const hPct = Number(payload?.height ?? 100)
  const outputFormat = String(payload?.outputFormat || 'jpeg')

  const input = await readUrlAsBuffer(imageUrl)
  const img = sharp(input)
  const meta = await img.metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (!width || !height) {
    throw new Error('Unable to read image dimensions')
  }

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

  const left = clamp(Math.round((xPct / 100) * width), 0, Math.max(0, width - 1))
  const top = clamp(Math.round((yPct / 100) * height), 0, Math.max(0, height - 1))

  const cropWidth = clamp(Math.round((wPct / 100) * width), 1, width)
  const cropHeight = clamp(Math.round((hPct / 100) * height), 1, height)

  const safeWidth = Math.min(cropWidth, width - left)
  const safeHeight = Math.min(cropHeight, height - top)
  if (safeWidth < 1 || safeHeight < 1) {
    throw new Error('Invalid crop bounds')
  }

  const outputsDir = await ensureOutputsDir()
  const ext = outputFormat === 'png' ? 'png' : outputFormat === 'webp' ? 'webp' : 'jpg'
  const filename = `crop-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const outPath = path.join(outputsDir, filename)

  const outBuffer = await sharp(input)
    .extract({ left, top, width: safeWidth, height: safeHeight })
    .toFormat(outputFormat as keyof sharp.FormatEnum)
    .toBuffer()

  await writeFile(outPath, outBuffer)
  return { imageUrl: `/outputs/${filename}` }
}

async function runLocalExtractFrame(payload: Record<string, unknown>): Promise<{ imageUrl: string }> {
  const videoUrl = String(payload?.videoUrl || '')
  const outputFormat = String(payload?.outputFormat || 'jpeg')
  const timestampRaw = payload?.timestamp

  const outputsDir = await ensureOutputsDir()
  const ext = outputFormat === 'png' ? 'png' : 'jpg'
  const filename = `frame-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const outPath = path.join(outputsDir, filename)

  const inputPath = await resolveUrlToLocalFile(videoUrl)

  const bin = resolveFfmpegPath()
  if (!bin) {
    throw new Error('ffmpeg binary not available (ffmpeg-static)')
  }
  ffmpeg.setFfmpegPath(bin)
  // Set ffprobe path from ffprobe-static so percentage timestamps work
  const fpBin = typeof ffprobePath === 'object' && ffprobePath !== null
    ? (ffprobePath as { path: string }).path
    : String(ffprobePath)
  if (fpBin) ffmpeg.setFfprobePath(fpBin)

  // Resolve timestamp: supports seconds (number/string) or percentage ("50%")
  const resolveTimestamp = (): Promise<number> => new Promise((resolve, reject) => {
    const raw = timestampRaw === '' || timestampRaw === undefined || timestampRaw === null
      ? '0'
      : String(timestampRaw)

    const pctMatch = raw.match(/^(\d+(?:\.\d+)?)%$/)
    if (pctMatch) {
      // Need video duration to convert percentage → seconds
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) return reject(err)
        const duration = data?.format?.duration ?? 0
        resolve((parseFloat(pctMatch[1]) / 100) * duration)
      })
    } else {
      resolve(parseFloat(raw) || 0)
    }
  })

  const timestamp = await resolveTimestamp()

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(timestamp)
      .outputOptions(['-frames:v 1'])
      .output(outPath)
      .on('end', () => resolve())
      .on('error', (err: unknown) => reject(err))
      .run()
  })

  return { imageUrl: `/outputs/${filename}` }
}

async function runGeminiText({
  model,
  systemPrompt,
  userMessage,
  temperature,
  maxTokens,
}: {
  model: string
  systemPrompt?: string
  userMessage: unknown
  temperature?: number
  maxTokens?: number
}): Promise<string> {
  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set GOOGLE_GEMINI_API_KEY (or GEMINI_API_KEY / GOOGLE_API_KEY) in your env and restart the dev server.'
    )
  }

  const safeSystem =
    systemPrompt === undefined || systemPrompt === null
      ? undefined
      : typeof systemPrompt === 'string'
        ? systemPrompt
        : JSON.stringify(systemPrompt)

  const safeUser =
    userMessage === undefined || userMessage === null
      ? ''
      : typeof userMessage === 'string'
        ? userMessage
        : JSON.stringify(userMessage)

  const prompt = safeSystem ? `${safeSystem}\n\n${safeUser}` : safeUser
  async function postGenerateContent(resolvedModel: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${apiKey}`
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    })
  }

  async function listModels(): Promise<Array<{ name: string; supportedGenerationMethods?: string[] }>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return []
    const json: { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> } | null = await res.json().catch(() => null)
    return Array.isArray(json?.models) ? json.models : []
  }

  // First attempt with the requested model.
  let res = await postGenerateContent(model)

  // If the model isn't available for this API version/key, retry with an available one.
  if (res.status === 404) {
    const models = await listModels()
    const supportsGenerate = (m: { name: string; supportedGenerationMethods?: string[] }) =>
      Array.isArray(m?.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes('generateContent')

    // Try to find a close match by suffix/prefix.
    const requested = String(model || '').toLowerCase()
    const requestedBare = requested.startsWith('models/') ? requested.slice('models/'.length) : requested

    const pick =
      models.find((m) => supportsGenerate(m) && String(m.name).toLowerCase().includes(requestedBare)) ||
      models.find((m) => supportsGenerate(m) && String(m.name).toLowerCase().includes('gemini')) ||
      models.find((m) => supportsGenerate(m))

    if (pick?.name) {
      const resolvedName = String(pick.name).replace(/^models\//, '')
      res = await postGenerateContent(resolvedName)
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini request failed: ${res.status} ${text}`)
  }

  const json: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null = await res.json().catch(() => null)
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text).filter(Boolean).join('')
  if (!text) {
    throw new Error('Gemini returned no text')
  }
  return String(text)
}

// Real node runner using Trigger.dev tasks
class TriggerNodeRunner implements NodeRunner {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(nodeId: string, nodeType: string, payload: Record<string, unknown>): Promise<unknown> {
    switch (nodeType) {
      case 'llm': {
        const model = String(payload.model || 'gemini-1.5-flash')
        const systemPrompt =
          payload.systemPrompt === undefined || payload.systemPrompt === null
            ? undefined
            : typeof payload.systemPrompt === 'string'
              ? payload.systemPrompt
              : JSON.stringify(payload.systemPrompt)
        const userMessage =
          payload.userMessage === undefined || payload.userMessage === null
            ? ''
            : typeof payload.userMessage === 'string'
              ? payload.userMessage
              : JSON.stringify(payload.userMessage)

        try {
          const client = getTriggerClient()
          const result = await client.runLLM({
            model,
            messages: [
              ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
              { role: 'user' as const, content: userMessage },
            ],
            images: payload.images as string[] | undefined,
            temperature: payload.temperature as number | undefined,
            maxTokens: payload.maxTokens as number | undefined,
            topP: payload.topP as number | undefined,
            frequencyPenalty: payload.frequencyPenalty as number | undefined,
            presencePenalty: payload.presencePenalty as number | undefined,
          })
          if (!result.success) throw new Error(result.error)
          // Normalize common shapes into { text } for the UI.
          const data = result.data as Record<string, unknown> | string | undefined
          let text: unknown
          if (typeof data === 'string') {
            text = data
          } else if (data) {
            text = data.text ?? (data.output as Record<string, unknown> | undefined)?.text ?? data.content ?? data.message
          }

          return text ? { text: String(text) } : data
        } catch {
          // Fallback for local/dev: call Gemini directly so workflows still return answers.
          const text = await runGeminiText({
            model,
            systemPrompt,
            userMessage,
            temperature: payload.temperature as number | undefined,
            maxTokens: payload.maxTokens as number | undefined,
          })
          return { text }
        }
      }
      case 'crop': {
        try {
          const client = getTriggerClient()
          const result = await client.runCropImage({
            imageUrl: String(payload.imageUrl || ''),
            x: Number(payload.x ?? 0),
            y: Number(payload.y ?? 0),
            width: Number(payload.width ?? 100),
            height: Number(payload.height ?? 100),
            outputFormat: (payload.outputFormat as 'jpeg' | 'png' | 'webp') || 'jpeg',
          })
          if (!result.success) throw new Error(result.error)
          return result.data
        } catch {
          return runLocalCropImage(payload as Record<string, unknown>)
        }
      }
      case 'extract-frame': {
        try {
          const client = getTriggerClient()
          const result = await client.runExtractFrame({
            videoUrl: String(payload.videoUrl || ''),
            timestamp: payload.timestamp === '' || payload.timestamp === undefined ? 0 : Number(payload.timestamp),
            outputFormat: (payload.outputFormat as 'jpeg' | 'png' | 'webp') || 'jpeg',
          })
          if (!result.success) throw new Error(result.error)
          return result.data
        } catch {
          return runLocalExtractFrame(payload as Record<string, unknown>)
        }
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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id: workflowId } = await params

  const body = await req.json().catch(() => null)
  const bodyNodes = Array.isArray(body?.nodes) ? (body.nodes as Array<{ id: string; type?: string; data?: Record<string, unknown>; position?: { x: number; y: number } }>) : undefined
  const bodyEdges = Array.isArray(body?.edges) ? (body.edges as Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>) : undefined
  const bodyWorkflow = body?.workflow && typeof body.workflow === 'object' ? body.workflow as { id?: string; name?: string; description?: string } : undefined

  let workflow: { id: string; name: string; description?: string | null; nodes: unknown; edges: unknown } | null = null
  try {
    workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId },
    })
  } catch (err) {
    // DB may not be configured in local dev; fall back to request payload.
    console.warn('DB unavailable while loading workflow; falling back to request payload', err)
  }

  const dbNodes = Array.isArray(workflow?.nodes) ? (workflow.nodes as Array<{ id: string; type?: string; data?: Record<string, unknown>; position?: { x: number; y: number } }>) : undefined
  const dbEdges = Array.isArray(workflow?.edges) ? (workflow.edges as Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>) : undefined

  // Prefer request payload when provided (node-level runs, DB-less mode, etc.).
  const nodes = bodyNodes && bodyNodes.length ? bodyNodes : dbNodes ?? []
  const edges = bodyEdges && bodyEdges.length ? bodyEdges : dbEdges ?? []

  if (!nodes.length) {
    return NextResponse.json(
      { success: false, error: 'No workflow nodes provided' },
      { status: 400 }
    )
  }

  const plan = buildExecutionPlan(nodes as Node[], edges as Edge[])

  const startedAt = new Date()
  let executionId: string | null = null
  let historyId: string | null = null

  // Best-effort persistence: execute workflows even if DB isn't configured.
  try {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow?.id ?? workflowId,
        userId,
        status: 'running',
        nodes: {},
        results: Prisma.JsonNull,
        trigger: 'manual',
        scope: 'full',
        nodeIds: [],
        startedAt,
      },
    })
    executionId = execution.id

    const history = await prisma.executionHistory.create({
      data: {
        userId,
        workflowId: workflow?.id ?? workflowId,
        executionId: execution.id,
        name: workflow?.name ?? bodyWorkflow?.name ?? 'Workflow Execution',
        description: workflow?.description ?? bodyWorkflow?.description ?? null,
        status: 'running',
        trigger: 'manual',
        scope: 'full',
        nodes: {},
        results: Prisma.JsonNull,
        executionTime: null,
        completedAt: null,
      },
    })
    historyId = history.id
  } catch (err) {
    console.warn('DB unavailable; running workflow without persistence', err)
  }

  const runner = new TriggerNodeRunner()
  const nodeStates: Record<string, unknown> = {}

  // Per-node update handler
  async function onNodeUpdate(nodeId: string, status: string, result?: unknown, error?: string) {
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

    // Persist per-node snapshot (best-effort)
    if (executionId) {
      try {
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { nodes: nodeStates as Prisma.InputJsonValue },
        })
      } catch (err) {
        console.warn('Failed to persist execution node state', err)
      }
    }

    if (historyId) {
      try {
        await prisma.executionHistory.update({
          where: { id: historyId },
          data: { nodes: nodeStates as Prisma.InputJsonValue },
        })
      } catch (err) {
        console.warn('Failed to persist history node state', err)
      }
    }
  }

  try {
    const { results, errors, status } = await executeWorkflow({
      plan,
      nodes: nodes as Node[],
      edges: edges as Edge[],
      runner,
      onUpdate: onNodeUpdate,
      concurrency: 4,
    })

    const completedAt = new Date()
    const executionTime = completedAt.getTime() - startedAt.getTime()

    if (executionId) {
      try {
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status,
            nodes: nodeStates as Prisma.InputJsonValue,
            results: results as Prisma.InputJsonValue,
            completedAt,
            executionTime,
          },
        })
      } catch (err) {
        console.warn('Failed to persist execution results', err)
      }
    }

    if (historyId) {
      try {
        await prisma.executionHistory.update({
          where: { id: historyId },
          data: {
            status,
            nodes: nodeStates as Prisma.InputJsonValue,
            results: results as Prisma.InputJsonValue,
            completedAt,
            executionTime,
          },
        })
      } catch (err) {
        console.warn('Failed to persist history results', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        executionId,
        status,
        results,
        errors,
      },
    })
  } catch (err) {
    const completedAt = new Date()
    const executionTime = completedAt.getTime() - startedAt.getTime()
    const status = 'failed'

    if (executionId) {
      try {
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status,
            nodes: nodeStates as Prisma.InputJsonValue,
            results: Prisma.JsonNull,
            completedAt,
            executionTime,
          },
        })
      } catch (err2) {
        console.warn('Failed to persist failed execution', err2)
      }
    }

    if (historyId) {
      try {
        await prisma.executionHistory.update({
          where: { id: historyId },
          data: {
            status,
            nodes: nodeStates as Prisma.InputJsonValue,
            results: Prisma.JsonNull,
            completedAt,
            executionTime,
          },
        })
      } catch (err2) {
        console.warn('Failed to persist failed history', err2)
      }
    }

    return NextResponse.json(
      { success: false, error: 'Execution failed', details: String(err) },
      { status: 500 }
    )
  }
}
