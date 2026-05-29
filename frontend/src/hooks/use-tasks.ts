import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task, PaginatedResponse, ApiResponse } from '@/lib/types';

interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const { data } = await api.get(`/tasks?${params.toString()}`);
      return data;
    },
  });
}

export function useTask(id: string) {
  return useQuery<ApiResponse<Task>>({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data } = await api.post('/tasks', task);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data } = await api.patch(`/tasks/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/tasks/${id}/status`, { status });
      return data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueriesData({ queryKey: ['tasks'] });

      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((task: Task) =>
            task.id === id ? { ...task, status } : task
          ),
        };
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
