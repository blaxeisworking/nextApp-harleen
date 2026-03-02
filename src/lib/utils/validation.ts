import { z } from 'zod';
import { VALIDATION_RULES } from './constants';

// Base validation schemas
export const textSchema = z.string().min(VALIDATION_RULES.TEXT_INPUT.MIN).max(VALIDATION_RULES.TEXT_INPUT.MAX);
export const percentageSchema = z.number().min(VALIDATION_RULES.PERCENTAGE.MIN).max(VALIDATION_RULES.PERCENTAGE.MAX);
export const urlSchema = z.string().url();
export const emailSchema = z.string().email();

// Node validation schemas
export const nodeLabelSchema = z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX);
export const workflowNameSchema = z.string().min(VALIDATION_RULES.WORKFLOW_NAME.MIN).max(VALIDATION_RULES.WORKFLOW_NAME.MAX);

// File validation
export const fileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  lastModified: z.number(),
});

export const imageFileSchema = fileSchema.refine(
  (file) => file.type.startsWith('image/'),
  { message: 'File must be an image' }
);

export const videoFileSchema = fileSchema.refine(
  (file) => file.type.startsWith('video/'),
  { message: 'File must be a video' }
);

// Generic helpers
export const nonEmptyStringSchema = z.string().min(1);