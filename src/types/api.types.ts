// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// API error
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// File upload
export interface FileUploadRequest {
  file: File;
  type: 'image' | 'video';
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

// Workflow API
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: unknown[];
  edges?: unknown[];
  tags?: string[];
}

// Execution API
export interface ExecuteWorkflowRequest {
  workflowId?: string;
  nodes?: unknown[];
  edges?: unknown[];
  nodeIds?: string[];
  inputs?: Record<string, unknown>;
}

export interface ExecuteWorkflowResponse {
  executionId: string;
  status: string;
  message?: string;
}

// History API
export interface ExecutionHistoryParams extends PaginationParams {
  workflowId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}

// Export/Import
export interface WorkflowExport {
  version: string;
  workflow: unknown;
  exportedAt: Date;
}

export interface WorkflowImport {
  workflow: unknown;
  options?: {
    overwrite?: boolean;
    importHistory?: boolean;
  };
}