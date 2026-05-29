import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export interface SubTask {
  id: string;
  title: string;
  isDone: boolean;
  createdAt: string;
}

// ─────────── Comments ───────────

export function useComments(taskId?: string) {
  return useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: async () => {
      if (!taskId) return [];
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      return data.data as Comment[];
    },
    enabled: !!taskId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'comments'] });
    },
  });
}

// ─────────── Sub-tasks ───────────

export function useSubTasks(taskId?: string) {
  return useQuery({
    queryKey: ['tasks', taskId, 'subtasks'],
    queryFn: async () => {
      if (!taskId) return [];
      const { data } = await api.get(`/tasks/${taskId}/subtasks`);
      return data.data as SubTask[];
    },
    enabled: !!taskId,
  });
}

export function useAddSubTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const { data } = await api.post(`/tasks/${taskId}/subtasks`, { title });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'subtasks'] });
    },
  });
}

export function useUpdateSubTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, subTaskId, isDone }: { taskId: string; subTaskId: string; isDone: boolean }) => {
      const { data } = await api.patch(`/tasks/${taskId}/subtasks/${subTaskId}`, { isDone });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'subtasks'] });
    },
  });
}

export function useDeleteSubTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, subTaskId }: { taskId: string; subTaskId: string }) => {
      const { data } = await api.delete(`/tasks/${taskId}/subtasks/${subTaskId}`);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'subtasks'] });
    },
  });
}
