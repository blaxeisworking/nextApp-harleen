// Add this to your constants file

// Connection Rules - defines which nodes can connect to which
export const CONNECTION_RULES = [
  // Text outputs can connect to: LLM prompts, Crop parameters
  { from: 'text', to: 'llm', type: 'text', handles: ['user-message', 'system-prompt'] },
  { from: 'text', to: 'crop', type: 'number', handles: ['x-percent', 'y-percent', 'width-percent', 'height-percent'] },
  { from: 'text', to: 'extract-frame', type: 'text', handles: ['timestamp'] },
  
  // Image outputs can connect to: LLM vision, Crop input
  { from: 'image', to: 'llm', type: 'image', handles: ['images'] },
  { from: 'image', to: 'crop', type: 'image', handles: ['image-url'] },
  
  // Video outputs can connect to: Extract Frame input
  { from: 'video', to: 'extract-frame', type: 'video', handles: ['video-url'] },
  
  // LLM outputs can connect to: Text nodes, other LLM nodes
  { from: 'llm', to: 'text', type: 'text', handles: ['text-output'] },
  { from: 'llm', to: 'llm', type: 'text', handles: ['user-message'] },
  
  // Crop outputs can connect to: LLM vision, other Crop nodes
  { from: 'crop', to: 'llm', type: 'image', handles: ['images'] },
  { from: 'crop', to: 'crop', type: 'image', handles: ['image-url'] },
  
  // Extract Frame outputs can connect to: LLM vision, Crop
  { from: 'extract-frame', to: 'llm', type: 'image', handles: ['images'] },
  { from: 'extract-frame', to: 'crop', type: 'image', handles: ['image-url'] },
] as const

// Connection colors by type
export const CONNECTION_COLORS = {
  text: '#3b82f6',      // Blue
  image: '#8b5cf6',     // Purple
  video: '#ec4899',     // Pink
  number: '#f59e0b',    // Yellow
} as const

// Handle positions for each node type
export const HANDLE_CONFIG = {
  text: {
    inputs: [{ id: 'text-target', position: 'left' }],
    outputs: [{ id: 'text-output', position: 'right' }],
  },
  image: {
    inputs: [{ id: 'image-target', position: 'left' }],
    outputs: [{ id: 'image-output', position: 'right' }],
  },
  video: {
    inputs: [{ id: 'video-target', position: 'left' }],
    outputs: [{ id: 'video-output', position: 'right' }],
  },
  llm: {
    inputs: [
      { id: 'system-prompt', position: 'left', label: 'System' },
      { id: 'user-message', position: 'left', label: 'Message' },
      { id: 'images', position: 'left', label: 'Images' },
    ],
    outputs: [{ id: 'llm-output', position: 'right', label: 'Output' }],
  },
  crop: {
    inputs: [
      { id: 'image-url', position: 'left', label: 'Image' },
      { id: 'x-percent', position: 'left', label: 'X%' },
      { id: 'y-percent', position: 'left', label: 'Y%' },
    ],
    outputs: [{ id: 'crop-output', position: 'right', label: 'Output' }],
  },
  'extract-frame': {
    inputs: [
      { id: 'video-url', position: 'left', label: 'Video' },
      { id: 'timestamp', position: 'left', label: 'Time' },
    ],
    outputs: [{ id: 'frame-output', position: 'right', label: 'Output' }],
  },
} as const

export const NODE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  LLM: 'llm',
  CROP: 'crop',
  EXTRACT_FRAME: 'extract-frame',
}