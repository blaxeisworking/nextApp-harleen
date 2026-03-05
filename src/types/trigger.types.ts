// Trigger.dev task types
export interface TriggerTask {
  id: string;
  name: string;
  type: 'llm' | 'crop-image' | 'extract-frame' | 'custom';
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  executionTime?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// LLM task payload
export interface LLMTaskPayload {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  images?: string[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Crop image task payload
export interface CropImageTaskPayload {
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

// Extract frame task payload
export interface ExtractFrameTaskPayload {
  videoUrl: string;
  timestamp: string | number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

// Task result
export interface TaskResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
}

// LLM result
export interface LLMResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

// Media processing result
export interface MediaResult {
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

// Trigger configuration
export interface TriggerConfig {
  apiKey: string;
  apiUrl: string;
  maxRetries: number;
  timeout: number;
  concurrency: number;
}