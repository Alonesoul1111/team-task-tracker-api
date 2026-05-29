import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project, PaginatedResponse, ApiResponse, User, AnalyticsData } from '@/lib/types';

export function useProjects(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const { data } = await api.get(`/projects?${searchParams.toString()}`);
      return data;
    },
  });
}

export function useProject(id: string) {
  return useQuery<ApiResponse<Project>>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: { name: string; description?: string }) => {
      const { data } = await api.post('/projects', project);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUsers(params: { page?: number; limit?: number; search?: string } = {}) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const { data } = await api.get(`/users?${searchParams.toString()}`);
      return data;
    },
  });
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/overview');
      return data.data;
    },
  });
}
