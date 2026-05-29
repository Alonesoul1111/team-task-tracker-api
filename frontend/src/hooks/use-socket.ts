'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('task:created', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`New task: "${task.title}"`);
      addNotification({
        title: 'New Task Created',
        message: `Task "${task.title}" was created.`,
        link: '/tasks'
      });
    });

    socket.on('task:updated', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addNotification({
        title: 'Task Updated',
        message: `Task "${task?.title || 'Unknown'}" was updated.`,
        link: '/tasks'
      });
    });

    socket.on('task:status-changed', (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.title) {
        toast.info(`Task "${data.title}" moved to ${data.to?.replace('_', ' ')}`);
        addNotification({
          title: 'Task Status Changed',
          message: `Task "${data.title}" moved to ${data.to?.replace('_', ' ')}.`,
          link: '/tasks'
        });
      }
    });

    socket.on('task:deleted', (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addNotification({
        title: 'Task Deleted',
        message: `A task was deleted.`,
        link: '/tasks'
      });
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, queryClient, addNotification]);

  return socketRef.current;
}
