export const SIDEBAR_WIDTH = {
  LEFT: 280,
  RIGHT: 340,
  COLLAPSED: 48,
}

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { Notification, ModalState } from '@/types/ui.types';
import { generateId } from '@/lib/utils/helpers';
import { NOTIFICATION_DURATION } from '@/lib/utils/constants';

interface UIStore {
  // Theme
  theme: 'light' | 'dark' | 'system';
  sidebar: {
    left: boolean;
    right: boolean;
    width: {
      left: number;
      right: number;
    };
  };
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  modals: ModalState[];
  
  // Loading states
  loading: {
    global: boolean;
    actions: Record<string, boolean>;
  };
  
  // UI Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: (side: 'left' | 'right') => void;
  setSidebarWidth: (side: 'left' | 'right', width: number) => void;
  resetSidebar: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  
  // Modals
  openModal: (modal: Omit<ModalState, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalState>) => void;
  
  // Loading
  setGlobalLoading: (loading: boolean) => void;
  setActionLoading: (action: string, loading: boolean) => void;
  isActionLoading: (action: string) => boolean;
  clearActionLoading: (action?: string) => void;
  
  // Theme helpers
  getEffectiveTheme: () => 'light' | 'dark';
  toggleTheme: () => void;
  
  // Keyboard shortcuts
  registerShortcuts: (shortcuts: unknown[]) => void;
  unregisterShortcuts: (ids: string[]) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          theme: 'system',
          sidebar: {
            left: true,
            right: true,
            width: {
              left: SIDEBAR_WIDTH.LEFT,
              right: SIDEBAR_WIDTH.RIGHT,
            },
          },
          notifications: [],
          modals: [],
          loading: {
            global: false,
            actions: {},
          },

          // Theme and sidebar
          setTheme: (theme) => {
            set({ theme });
            // Document theme is applied by ThemeProvider (SSR-safe).
          },
          
          toggleSidebar: (side) => set((state) => ({
            sidebar: {
              ...state.sidebar,
              [side]: !state.sidebar[side],
            },
          })),
          
          setSidebarWidth: (side, width) => set((state) => ({
            sidebar: {
              ...state.sidebar,
              width: {
                ...state.sidebar.width,
                [side]: Math.max(SIDEBAR_WIDTH.COLLAPSED, Math.min(width, 600)), // Min 48px, Max 600px
              },
            },
          })),
          
          resetSidebar: () => set(() => ({
            sidebar: {
              left: true,
              right: true,
              width: {
                left: SIDEBAR_WIDTH.LEFT,
                right: SIDEBAR_WIDTH.RIGHT,
              },
            },
          })),
          
          // Notifications
          addNotification: (notification) => set((state) => {
            const duration =
              notification.duration ??
              NOTIFICATION_DURATION[notification.type] ??
              0

            const newNotification: Notification = {
              ...notification,
              id: generateId('notification'),
              createdAt: new Date(),
              duration,
            };

            // Auto-remove notification after duration
            if (duration > 0) {
              setTimeout(() => {
                get().removeNotification(newNotification.id);
              }, duration);
            }

            return {
              notifications: [...state.notifications, newNotification],
            };
          }),
          
          removeNotification: (id) => set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          })),
          
          clearNotifications: () => set({ notifications: [] }),
          
          updateNotification: (id, updates) => set((state) => ({
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, ...updates } : n
            ),
          })),
          
          // Modals
          openModal: (modal) => {
            const id = generateId('modal');
            const newModal: ModalState = {
              ...modal,
              id,
              backdrop: modal.backdrop ?? true,
              closable: modal.closable ?? true,
              position: modal.position ?? 'center',
              size: modal.size ?? 'md',
            };
            
            set((state) => ({
              modals: [...state.modals, newModal],
            }));
            
            return id;
          },
          
          closeModal: (id) => set((state) => ({
            modals: state.modals.filter(m => m.id !== id),
          })),
          
          closeAllModals: () => set({ modals: [] }),
          
          updateModal: (id, updates) => set((state) => ({
            modals: state.modals.map(m => 
              m.id === id ? { ...m, ...updates } : m
            ),
          })),
          
          // Loading states
          setGlobalLoading: (global) => set((state) => ({
            loading: { ...state.loading, global },
          })),
          
          setActionLoading: (action, loading) => set((state) => ({
            loading: {
              ...state.loading,
              actions: {
                ...state.loading.actions,
                [action]: loading,
              },
            },
          })),
          
          isActionLoading: (action) => {
            const state = get();
            return state.loading.global || state.loading.actions[action] || false;
          },
          
          clearActionLoading: (action) =>
            set((state) => {
              if (action) {
                const remainingActions = Object.fromEntries(
                  Object.entries(state.loading.actions).filter(([key]) => key !== action)
                )
                return {
                  loading: {
                    ...state.loading,
                    actions: remainingActions,
                  },
                }
              }

              return {
                loading: {
                  ...state.loading,
                  actions: {},
                },
              }
            }),
          
          // Theme helpers
          getEffectiveTheme: () => {
            const { theme } = get();
            if (theme === 'system') {
              if (typeof window === 'undefined') return 'light'
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return theme;
          },
          
          toggleTheme: () => set((state) => {
            const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
            const currentIndex = themes.indexOf(state.theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];

            return { theme: nextTheme };
          }),
          
          // Keyboard shortcuts (placeholder for now)
          registerShortcuts: (shortcuts) => {
            // This will be implemented when we add keyboard shortcut support
            console.log('Registering shortcuts:', shortcuts);
          },
          
          unregisterShortcuts: (ids) => {
            // This will be implemented when we add keyboard shortcut support
            console.log('Unregistering shortcuts:', ids);
          },
        }),
        {
          name: 'ui-store',
          partialize: (state) => ({
            theme: state.theme,
            sidebar: state.sidebar,
          }),
        }
      )
    ),
    {
      name: 'ui-store',
    }
  )
);

// Selectors for common UI state
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useModals = () => useUIStore((state) => state.modals);
export const useLoading = () => useUIStore((state) => state.loading);

// Helper hooks
export const useNotification = () => {
  const { addNotification, removeNotification } = useUIStore();
  return { addNotification, removeNotification };
};

export const useModal = () => {
  const { openModal, closeModal, closeAllModals } = useUIStore();
  return { openModal, closeModal, closeAllModals };
};

export const useLoadingState = () => {
  const { setGlobalLoading, setActionLoading, isActionLoading } = useUIStore();
  return { setGlobalLoading, setActionLoading, isActionLoading };
};