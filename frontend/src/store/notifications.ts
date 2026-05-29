import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
};

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

// Build a unique storage key per user so notifications are never shared
// across different accounts on the same browser.
function getStorageKey(): string {
  try {
    const authRaw = localStorage.getItem('auth-storage');
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      const userId = parsed?.state?.user?.id;
      if (userId) return `notifications-${userId}`;
    }
  } catch {}
  return 'notifications-storage';
}

// Dynamic storage that reads the key at runtime so it picks up the
// correct user even after hot-reloads or token refreshes.
const dynamicStorage = {
  getItem: (name: string) => {
    const key = getStorageKey();
    return localStorage.getItem(key);
  },
  setItem: (name: string, value: string) => {
    const key = getStorageKey();
    localStorage.setItem(key, value);
  },
  removeItem: (name: string) => {
    const key = getStorageKey();
    localStorage.removeItem(key);
  },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (notification) => {
        set((state) => {
          const newNotification: AppNotification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 9),
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          return {
            notifications: [newNotification, ...state.notifications].slice(0, 50),
          };
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => dynamicStorage),
    }
  )
);
