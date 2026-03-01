import { z } from 'zod';
import { NODE_TYPES, VALIDATION_RULES } from '@/lib/utils/constants';

// Base node schema
export const baseNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(Object.values(NODE_TYPES) as [string, ...string[]]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.string(),
    value: z.any().optional(),
    config: z.record(z.any()).optional(),
    isExecuting: z.boolean().optional(),
    executionTime: z.number().optional(),
    error: z.string().optional(),
    outputs: z.record(z.any()).optional(),
  }),
});

// Text node schema
export const textNodeSchema = baseNodeSchema.extend({
  type: z.literal(NODE_TYPES.TEXT),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.literal(NODE_TYPES.TEXT),
    value: z.string().max(VALIDATION_RULES.TEXT_INPUT.MAX).optional(),
    config: z.object({}).optional(),
  }),
});

// Image node schema
export const imageNodeSchema = baseNodeSchema.extend({
  type: z.literal(NODE_TYPES.IMAGE),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.literal(NODE_TYPES.IMAGE),
    value: z.string().url().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().positive().optional(),
  }),
});

// Video node schema
export const videoNodeSchema = baseNodeSchema.extend({
  type: z.literal(NODE_TYPES.VIDEO),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.literal(NODE_TYPES.VIDEO),
    value: z.string().url().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().positive().optional(),
    duration: z.number().positive().optional(),
  }),
});

// LLM node schema
export const llmNodeSchema = baseNodeSchema.extend({
  type: z.literal(NODE_TYPES.LLM),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.literal(NODE_TYPES.LLM),
    config: z.object({
      model: z.string().min(1),
      systemPrompt: z.string().max(VALIDATION_RULES.TEXT_INPUT.MAX).optional(),
      userMessage: z.string().max(VALIDATION_RULES.TEXT_INPUT.MAX).optional(),
      images: z.array(z.string().url()).max(10).optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().max(8192).optional(),
      topP: z.number().min(0).max(1).optional(),
      frequencyPenalty: z.number().min(-2).max(2).optional(),
      presencePenalty: z.number().min(-2).max(2).optional(),
    }),
    outputs: z.object({
      text: z.string().optional(),
      usage: z.object({
        promptTokens: z.number().nonnegative(),
        completionTokens: z.number().nonnegative(),
        totalTokens: z.number().nonnegative(),
      }).optional(),
    }).optional(),
  }),
});

// Crop node schema
export const cropNodeSchema = baseNodeSchema.extend({
  type: z.literal(NODE_TYPES.CROP),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.literal(NODE_TYPES.CROP),
    config: z.object({
      imageUrl: z.string().url(),
      x: z.number().min(0).max(100).default(0),
      y: z.number().min(0).max(100).default(0),
      width: z.number().min(1).max(100).default(100),
      height: z.number().min(1).max(100).default(100),
    }),
    outputs: z.object({
      imageUrl: z.string().url().optional(),
    }).optional(),
  }),
});

// Extract frame node schema
export const extractFrameNodeSchema = baseNodeSchema.extend({
  type: z.literal(NODE_TYPES.EXTRACT_FRAME),
  data: z.object({
    label: z.string().min(VALIDATION_RULES.NODE_LABEL.MIN).max(VALIDATION_RULES.NODE_LABEL.MAX),
    type: z.literal(NODE_TYPES.EXTRACT_FRAME),
    config: z.object({
      videoUrl: z.string().url(),
      timestamp: z.union([z.string(), z.number()]).default('0'),
    }),
    outputs: z.object({
      imageUrl: z.string().url().optional(),
    }).optional(),
  }),
});

// Union of all node schemas
export const nodeSchema = z.discriminatedUnion('type', [
  textNodeSchema,
  imageNodeSchema,
  videoNodeSchema,
  llmNodeSchema,
  cropNodeSchema,
  extractFrameNodeSchema,
]);

// Node validation functions
export const validateNode = (node: any) => {
  return nodeSchema.safeParse(node);
};

export const validateNodeType = (type: string, data: any) => {
  switch (type) {
    case NODE_TYPES.TEXT:
      return textNodeSchema.shape.data.safeParse(data);
    case NODE_TYPES.IMAGE:
      return imageNodeSchema.shape.data.safeParse(data);
    case NODE_TYPES.VIDEO:
      return videoNodeSchema.shape.data.safeParse(data);
    case NODE_TYPES.LLM:
      return llmNodeSchema.shape.data.safeParse(data);
    case NODE_TYPES.CROP:
      return cropNodeSchema.shape.data.safeParse(data);
    case NODE_TYPES.EXTRACT_FRAME:
      return extractFrameNodeSchema.shape.data.safeParse(data);
    default:
      return { success: false, error: { message: 'Unknown node type' } };
  }
};

// Connection validation schema
export const connectionSchema = z.object({
  source: z.string().min(1),
  sourceHandle: z.string().min(1),
  target: z.string().min(1),
  targetHandle: z.string().min(1),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.object({}).optional(),
});

// Node position validation
export const nodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Node size validation
export const nodeSizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});