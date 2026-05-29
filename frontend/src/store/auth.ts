import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { User, AuthResponse } from '@/lib/types';

// Lazy import to avoid circular dependency
function clearNotifications() {
  try {
    const { useNotificationStore } = require('@/store/notifications');
    useNotificationStore.getState().clearAll();
  } catch {}
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; organizationName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (data: AuthResponse) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (data: AuthResponse) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Clear in-memory notifications so next user starts fresh
        clearNotifications();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      login: async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        get().setAuth(data.data);
      },

      register: async (input) => {
        const { data } = await api.post('/auth/register', input);
        get().setAuth(data.data);
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Logout even if API call fails
        }
        get().clearAuth();
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            set({ isLoading: false });
            return;
          }

          const { data } = await api.get('/auth/me');
          set({
            user: data.data,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          get().clearAuth();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
