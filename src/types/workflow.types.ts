import { Node, Edge } from '@xyflow/react';
import { CustomNodeData } from './node.types';

// Workflow interface
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  tags?: string[];
}

// Workflow execution status
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'partial';

// Node execution result
export interface NodeExecutionResult {
  nodeId: string;
  status: 'success' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  executionTime: number;
  startedAt: Date;
  completedAt?: Date;
}

// Workflow execution
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  name?: string;
  description?: string;
  status: ExecutionStatus;
  nodes: Record<string, {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    output?: unknown;
    error?: string;
    executionTime?: number;
    startedAt?: Date;
    completedAt?: Date;
  }>;
  results?: NodeExecutionResult[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  executionTime?: number;
  trigger: 'manual' | 'scheduled' | 'api';
  scope: 'full' | 'partial' | 'single';
  nodeIds?: string[]; // For partial executions
}

// Execution request
export interface ExecutionRequest {
  workflowId?: string;
  nodes?: Node<CustomNodeData>[];
  edges?: Edge[];
  nodeIds?: string[]; // For partial execution
  inputs?: Record<string, unknown>;
}

// Execution response
export interface ExecutionResponse {
  executionId: string;
  status: ExecutionStatus;
  message?: string;
  results?: Record<string, unknown>;
}

// Workflow template
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  tags: string[];
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
}