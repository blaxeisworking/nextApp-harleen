import { z } from 'zod';

// API request/response schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
  });
};

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.date().default(() => new Date()),
});

// File upload schemas
export const fileUploadRequestSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image', 'video']),
  metadata: z.record(z.any()).optional(),
});

export const fileUploadResponseSchema = z.object({
  url: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().positive().default(30000),
  notifications: z.object({
    email: z.boolean().default(true),
    browser: z.boolean().default(true),
    execution: z.boolean().default(true),
  }).default({}),
  editor: z.object({
    snapToGrid: z.boolean().default(true),
    gridSize: z.number().positive().default(20),
    showGrid: z.boolean().default(true),
    showMinimap: z.boolean().default(true),
    showControls: z.boolean().default(true),
  }).default({}),
});

// Validation functions for API
export const validateApiResponse = <T>(schema: z.ZodType<T>, data: any): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`);
  }
  return result.data;
};

export const validateFileUpload = (data: any) => {
  return fileUploadRequestSchema.safeParse(data);
};

export const validateUserPreferences = (data: any) => {
  return userPreferencesSchema.safeParse(data);
};