import { z } from 'zod';
import { nodeSchema, connectionSchema } from './node-schemas';
import { VALIDATION_RULES } from '@/lib/utils/constants';

// Workflow base schema
export const workflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(VALIDATION_RULES.WORKFLOW_NAME.MIN).max(VALIDATION_RULES.WORKFLOW_NAME.MAX),
  description: z.string().max(500).optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(connectionSchema),
  userId: z.string().min(1),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
});

// Create workflow schema
export const createWorkflowSchema = z.object({
  name: z.string().min(VALIDATION_RULES.WORKFLOW_NAME.MIN).max(VALIDATION_RULES.WORKFLOW_NAME.MAX),
  description: z.string().max(500).optional(),
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(connectionSchema).default([]),
  tags: z.array(z.string()).max(10).optional(),
});

// Update workflow schema
export const updateWorkflowSchema = z.object({
  name: z.string().min(VALIDATION_RULES.WORKFLOW_NAME.MIN).max(VALIDATION_RULES.WORKFLOW_NAME.MAX).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(connectionSchema).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// Workflow execution schema
export const executionRequestSchema = z.object({
  workflowId: z.string().min(1).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(connectionSchema).optional(),
  nodeIds: z.array(z.string().min(1)).optional(),
  inputs: z.record(z.any()).optional(),
});

// Execution response schema
export const executionResponseSchema = z.object({
  executionId: z.string().min(1),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'partial']),
  message: z.string().optional(),
  results: z.record(z.any()).optional(),
});

// Workflow template schema
export const workflowTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(VALIDATION_RULES.WORKFLOW_NAME.MIN).max(VALIDATION_RULES.WORKFLOW_NAME.MAX),
  description: z.string().max(500),
  category: z.string(),
  nodes: z.array(nodeSchema),
  edges: z.array(connectionSchema),
  tags: z.array(z.string()).max(10),
  isPublic: z.boolean().default(false),
  createdBy: z.string().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  usageCount: z.number().nonnegative().default(0),
  rating: z.number().min(0).max(5).default(0),
});

// Workflow import/export schema
export const workflowExportSchema = z.object({
  version: z.string().default('1.0.0'),
  workflow: workflowSchema,
  exportedAt: z.date().default(() => new Date()),
});

export const workflowImportSchema = z.object({
  workflow: workflowSchema,
  options: z.object({
    overwrite: z.boolean().default(false),
    importHistory: z.boolean().default(false),
  }).optional(),
});

// DAG validation
export const dagSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(connectionSchema),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// History query schema
export const historyQuerySchema = z.object({
  workflowId: z.string().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'partial']).optional(),
  fromDate: z.date().or(z.string()).optional(),
  toDate: z.date().or(z.string()).optional(),
  ...paginationSchema.shape,
});

// Validation functions
export const validateWorkflow = (workflow: any) => {
  return workflowSchema.safeParse(workflow);
};

export const validateCreateWorkflow = (data: any) => {
  return createWorkflowSchema.safeParse(data);
};

export const validateUpdateWorkflow = (data: any) => {
  return updateWorkflowSchema.safeParse(data);
};

export const validateExecutionRequest = (data: any) => {
  return executionRequestSchema.safeParse(data);
};

// Check for circular dependencies
export const validateDAG = (nodes: any[], edges: any[]) => {
  const adjacency: Record<string, string[]> = {};
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  nodes.forEach(node => {
    adjacency[node.id] = [];
  });

  edges.forEach(edge => {
    adjacency[edge.source].push(edge.target);
  });

  const hasCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const neighbor of adjacency[nodeId]) {
      if (hasCycle(neighbor)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (hasCycle(node.id)) return false;
  }

  return true;
};

// Validate node connections
export const validateConnections = (nodes: any[], edges: any[]) => {
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.id] = node.type;
    return acc;
  }, {} as Record<string, string>);

  const invalidConnections: string[] = [];

  edges.forEach(edge => {
    const sourceType = nodeTypes[edge.source];
    const targetType = nodeTypes[edge.target];

    // Add connection validation logic here based on your rules
    if (!sourceType || !targetType) {
      invalidConnections.push(`Invalid connection: ${edge.source} -> ${edge.target}`);
    }
  });

  return {
    valid: invalidConnections.length === 0,
    errors: invalidConnections,
  };
};