// UI state
export interface UIState {
  theme: 'light' | 'dark';
  sidebar: {
    left: boolean;
    right: boolean;
    width: {
      left: number;
      right: number;
    };
  };
  notifications: Notification[];
  modals: ModalState[];
  loading: {
    global: boolean;
    actions: Record<string, boolean>;
  };
}

// Notification
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

// Modal state
export interface ModalState {
  id: string;
  type: 'dialog' | 'sheet' | 'drawer' | 'custom';
  title?: string;
  description?: string;
  content: React.ComponentType<Record<string, unknown>>;
  props?: Record<string, unknown>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  backdrop?: boolean;
  closable?: boolean;
}

// Node palette
export interface NodePaletteItem {
  id: string;
  label: string;
  description: string;
  category: 'input' | 'processing' | 'output';
  icon: string;
  color: string;
  nodeType: string;
  defaultConfig?: unknown;
}

// Execution controls
export interface ExecutionControls {
  canExecute: boolean;
  canStop: boolean;
  canPause: boolean;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress?: number;
  ETA?: number;
}

// Drag and drop
export interface DragItem {
  type: string;
  data: unknown;
  offset: {
    x: number;
    y: number;
  };
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description: string;
  context?: string;
}

// Context menu
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

// Empty state
export interface EmptyStateConfig {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  help?: {
    label: string;
    url: string;
  };
}