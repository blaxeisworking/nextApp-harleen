import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@clerk/nextjs/server';

interface UserState {
  // User data
  user: User | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    autoSave: boolean;
    autoSaveInterval: number;
    notifications: {
      email: boolean;
      browser: boolean;
      execution: boolean;
    };
    editor: {
      snapToGrid: boolean;
      gridSize: number;
      showGrid: boolean;
      showMinimap: boolean;
      showControls: boolean;
    };
  };
  
  // API Keys
  apiKeys: Array<{
    id: string;
    name: string;
    permissions: string[];
    expiresAt?: Date;
    lastUsedAt?: Date;
    createdAt: Date;
    isActive: boolean;
  }>;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void;
  loadUserPreferences: () => Promise<void>;
  saveUserPreferences: () => Promise<void>;
  resetPreferences: () => void;
  
  // API Keys
  loadApiKeys: () => Promise<void>;
  createApiKey: (name: string, permissions: string[], expiresAt?: Date) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;
  updateApiKey: (id: string, updates: Partial<UserState['apiKeys'][0]>) => Promise<void>;
  
  // User operations
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  exportData: () => Promise<void>;
}

const defaultPreferences = {
  theme: 'system' as const,
  autoSave: true,
  autoSaveInterval: 30000,
  notifications: {
    email: true,
    browser: true,
    execution: true,
  },
  editor: {
    snapToGrid: true,
    gridSize: 20,
    showGrid: true,
    showMinimap: true,
    showControls: true,
  },
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        userId: null,
        isAuthenticated: false,
        isLoading: true,
        preferences: defaultPreferences,
        apiKeys: [],

        // User management
        setUser: (user) => {
          set({
            user,
            userId: user?.id || null,
            isAuthenticated: !!user,
            isLoading: false,
          });
          
          // Load user preferences when user is set
          if (user) {
            get().loadUserPreferences();
            get().loadApiKeys();
          }
        },
        
        setLoading: (loading) => set({ isLoading: loading }),
        
        updatePreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
        
        loadUserPreferences: async () => {
          const { userId } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/preferences`);
            if (response.ok) {
              const preferences = await response.json();
              set({ preferences });
            }
          } catch (error) {
            console.error('Failed to load user preferences:', error);
          }
        },
        
        saveUserPreferences: async () => {
          const { userId, preferences } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/preferences`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(preferences),
            });
            
            if (!response.ok) {
              throw new Error('Failed to save preferences');
            }
          } catch (error) {
            console.error('Failed to save user preferences:', error);
          }
        },
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // API Keys management
        loadApiKeys: async () => {
          const { userId } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/api-keys`);
            if (response.ok) {
              const apiKeys = await response.json();
              set({ apiKeys });
            }
          } catch (error) {
            console.error('Failed to load API keys:', error);
          }
        },
        
        createApiKey: async (name, permissions, expiresAt) => {
          const { userId } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/api-keys`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, permissions, expiresAt }),
            });
            
            if (response.ok) {
              const newKey = await response.json();
              set((state) => ({
                apiKeys: [...state.apiKeys, newKey],
              }));
            } else {
              throw new Error('Failed to create API key');
            }
          } catch (error) {
            console.error('Failed to create API key:', error);
            throw error;
          }
        },
        
        deleteApiKey: async (id) => {
          const { userId } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/api-keys/${id}`, {
              method: 'DELETE',
            });
            
            if (response.ok) {
              set((state) => ({
                apiKeys: state.apiKeys.filter(key => key.id !== id),
              }));
            } else {
              throw new Error('Failed to delete API key');
            }
          } catch (error) {
            console.error('Failed to delete API key:', error);
            throw error;
          }
        },
        
        updateApiKey: async (id, updates) => {
          const { userId, apiKeys } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/api-keys/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (response.ok) {
              const updatedKey = await response.json();
              set((state) => ({
                apiKeys: state.apiKeys.map(key => 
                  key.id === id ? { ...key, ...updatedKey } : key
                ),
              }));
            } else {
              throw new Error('Failed to update API key');
            }
          } catch (error) {
            console.error('Failed to update API key:', error);
            throw error;
          }
        },
        
        // User operations
        signOut: async () => {
          try {
            await fetch('/api/auth/sign-out', { method: 'POST' });
            set({
              user: null,
              userId: null,
              isAuthenticated: false,
              apiKeys: [],
            });
          } catch (error) {
            console.error('Sign out error:', error);
          }
        },
        
        deleteAccount: async () => {
          const { userId } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}`, {
              method: 'DELETE',
            });
            
            if (response.ok) {
              set({
                user: null,
                userId: null,
                isAuthenticated: false,
                preferences: defaultPreferences,
                apiKeys: [],
              });
            } else {
              throw new Error('Failed to delete account');
            }
          } catch (error) {
            console.error('Failed to delete account:', error);
            throw error;
          }
        },
        
        exportData: async () => {
          const { userId } = get();
          if (!userId) return;
          
          try {
            const response = await fetch(`/api/users/${userId}/export`);
            if (response.ok) {
              const data = await response.json();
              // Create download link
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nextflow-data-${userId}-${new Date().toISOString()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } else {
              throw new Error('Failed to export data');
            }
          } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
          }
        },
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          preferences: state.preferences,