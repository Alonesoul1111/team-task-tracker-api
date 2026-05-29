export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  status?: 'ACTIVE' | 'INACTIVE' | 'LEFT';
  organizationId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
  assigneeId?: string;
  creatorId: string;
  projectId: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  creator?: Pick<User, 'id' | 'name' | 'email'>;
  project?: { id: string; name: string };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AnalyticsData {
  statusDistribution: Array<{ status: string; count: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
  overdueByUser: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    overdue_count: number;
    total_assigned: number;
    overdue_percentage: number;
  }>;
  completionMetrics: {
    avgHours: number;
    medianHours: number;
    minHours: number;
    maxHours: number;
    totalCompleted: number;
  };
  tasksPerDay: Array<{ date: string; count: number }>;
  topPerformers: Array<{
    user_id: string;
    user_name: string;
    completed_count: number;
    avg_completion_hours: number;
    rank: number;
  }>;
  projectSummary: Array<{
    project_id: string;
    project_name: string;
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    blocked_tasks: number;
    completion_rate: number;
  }>;
}
