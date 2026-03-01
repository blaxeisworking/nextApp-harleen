// API response wrapper
export interface ApiResponse<T = any> {
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
  details?: any;
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
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, any>;
}

// Workflow API
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: any[];
  edges?: any[];
  tags?: string[];
}

// Execution API
export interface ExecuteWorkflowRequest {
  workflowId?: string;
  nodes?: any[];
  edges?: any[];
  nodeIds?: string[];
  inputs?: Record<string, any>;
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
  workflow: any;
  exportedAt: Date;
}

export interface WorkflowImport {
  workflow: any;
  options?: {
    overwrite?: boolean;
    importHistory?: boolean;
  };
}