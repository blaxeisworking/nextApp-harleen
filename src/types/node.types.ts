import { Node } from '@xyflow/react';

// Base node data interface
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  value?: unknown;
  config?: Record<string, unknown>;
  isExecuting?: boolean;
  executionTime?: number;
  error?: string;
  outputs?: Record<string, unknown>;
}

// Specific node data types
export interface TextNodeData extends BaseNodeData {
  type: 'text';
  value: string;
}

export interface ImageNodeData extends BaseNodeData {
  type: 'image';
  value: string; // URL
  fileName?: string;
  fileSize?: number;
}

export interface VideoNodeData extends BaseNodeData {
  type: 'video';
  value: string; // URL
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

export interface LLMNodeData extends BaseNodeData {
  type: 'llm';
  config: {
    model: string;
    systemPrompt?: string;
    userMessage?: string;
    images?: string[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  outputs?: {
    text?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface CropNodeData extends BaseNodeData {
  type: 'crop';
  config: {
    imageUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  outputs?: {
    imageUrl: string;
  };
}

export interface ExtractFrameNodeData extends BaseNodeData {
  type: 'extract-frame';
  config: {
    videoUrl: string;
    timestamp: string | number; // seconds or percentage
  };
  outputs?: {
    imageUrl: string;
  };
}

// Union type for all node data
export type CustomNodeData = 
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | LLMNodeData
  | CropNodeData
  | ExtractFrameNodeData;

// Node types with proper typing
export type CustomNode = Node<CustomNodeData>;

// Connection validation
export interface ConnectionRule {
  from: string[];
  to: string[];
  type: 'text' | 'image' | 'video' | 'any';
}

// Node configuration
export interface NodeConfig {
  id: string;
  label: string;
  description: string;
  category: 'input' | 'processing' | 'output';
  inputs: {
    id: string;
    label: string;
    type: 'text' | 'image' | 'video' | 'number' | 'any';
    required?: boolean;
    multiple?: boolean;
  }[];
  outputs: {
    id: string;
    label: string;
    type: 'text' | 'image' | 'video' | 'any';
  }[];
  icon: string;
  color: string;
}