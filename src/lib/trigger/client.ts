import { TriggerTask, LLMTaskPayload, CropImageTaskPayload, ExtractFrameTaskPayload, TaskResult } from '@/types/trigger.types'

/**
 * Minimal Trigger.dev HTTP client.
 * In production, replace with @trigger.dev/sdk if available.
 */
export class TriggerClient {
  private apiKey: string
  private apiUrl: string

  constructor({ apiKey, apiUrl }: { apiKey: string; apiUrl: string }) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}${path}`
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Trigger.dev request failed: ${res.status} ${text}`)
    }
    return res.json()
  }

  /**
   * Trigger a task and return the task metadata.
   */
  async triggerTask(taskType: 'llm' | 'crop-image' | 'extract-frame', payload: any): Promise<TriggerTask> {
    const task = await this.request('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify({
        type: taskType,
        payload,
      }),
    })
    return task as TriggerTask
  }

  /**
   * Poll task status.
   */
  async getTask(taskId: string): Promise<TriggerTask> {
    const task = await this.request(`/v1/tasks/${taskId}`)
    return task as TriggerTask
  }

  /**
   * Wait for a task to complete (simple polling).
   */
  async waitForTask(taskId: string, { pollInterval = 1000, timeout = 60000 } = {}): Promise<TaskResult> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const task = await this.getTask(taskId)
      if (task.status === 'completed') {
        return {
          success: true,
          data: task.result,
          executionTime: task.executionTime || 0,
        }
      }
      if (task.status === 'failed') {
        return {
          success: false,
          error: task.error || 'Task failed',
          executionTime: task.executionTime || 0,
        }
      }
      await new Promise(res => setTimeout(res, pollInterval))
    }
    throw new Error('Task timed out')
  }

  // Convenience wrappers for each node type
  async runLLM(payload: LLMTaskPayload): Promise<TaskResult> {
    const task = await this.triggerTask('llm', payload)
    return this.waitForTask(task.id)
  }

  async runCropImage(payload: CropImageTaskPayload): Promise<TaskResult> {
    const task = await this.triggerTask('crop-image', payload)
    return this.waitForTask(task.id)
  }

  async runExtractFrame(payload: ExtractFrameTaskPayload): Promise<TaskResult> {
    const task = await this.triggerTask('extract-frame', payload)
    return this.waitForTask(task.id)
  }
}

let client: TriggerClient | null = null

export function getTriggerClient(): TriggerClient {
  if (!client) {
    const apiKey = process.env.TRIGGER_API_KEY
    const apiUrl = process.env.TRIGGER_API_URL || 'https://api.trigger.dev'
    if (!apiKey) throw new Error('Missing TRIGGER_API_KEY')
    client = new TriggerClient({ apiKey, apiUrl })
  }
  return client
}