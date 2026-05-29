'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuthStore } from '@/store/auth';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-data';
import { 
  KanbanSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import CreateTaskDialog from '@/components/create-task-dialog';
import { statusConfig, priorityConfig } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Get total counts by querying the tasks endpoint
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ limit: 100 });
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 100 });

  if (!user) return null;

  const tasks = tasksData?.data || [];
  const projects = projectsData?.data || [];

  // Compute local stats
  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewCount = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const blockedCount = tasks.filter(t => t.status === 'BLOCKED').length;

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Find overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now);

  const stats = [
    { name: 'To Do', value: todoCount, icon: KanbanSquare, color: 'text-[#64748B]' },
    { name: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-[#3B82F6]' },
    { name: 'In Review', value: inReviewCount, icon: TrendingUp, color: 'text-[#F59E0B]' },
    { name: 'Done', value: doneCount, icon: CheckCircle2, color: 'text-[#22C55E]' },
    { name: 'Blocked', value: blockedCount, icon: AlertTriangle, color: 'text-[#EF4444]' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-[0.875rem]">Hello, {user.name}. Here is what is happening today.</p>
        </div>

        {/* Create Task Button (ADMIN & MANAGER only) */}
        {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        )}
      </div>

      {/* Overdue alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-[var(--radius-card)] p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#EF4444] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-[#FCA5A5] text-[0.875rem]">Attention: {overdueTasks.length} Overdue Tasks</h4>
            <p className="text-[#FCA5A5]/80 text-[0.8125rem] mt-0.5">Please review the blocked or unfinished tasks that missed their deadlines.</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{stat.name}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="text-[1.75rem] font-bold text-[var(--text-primary)] leading-none">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Progress & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress circular representation */}
        <div className="card p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] mb-1">Completion Progress</h3>
            <p className="text-[var(--text-muted)] text-[0.8125rem]">Total task conversion metrics</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center h-32 w-32">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-[var(--border-subtle)] fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-[var(--brand)] fill-none transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray={351.8}
                  strokeDashoffset={351.8 - (351.8 * completionRate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-[1.5rem] font-bold text-[var(--text-primary)]">{completionRate}%</div>
            </div>
          </div>

          <div className="text-center text-[0.8125rem] text-[var(--text-secondary)] bg-[rgba(255,255,255,0.02)] py-2.5 rounded-[var(--radius-btn)] border border-[var(--border-subtle)]">
            {doneCount} of {totalTasks} tasks resolved
          </div>
        </div>

        {/* Project breakdown cards */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] mb-1">Projects Overview</h3>
              <p className="text-[var(--text-muted)] text-[0.8125rem]">Current active project details</p>
            </div>
            <Link href="/projects" className="text-[0.8125rem] font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {projectsLoading ? (
              <div className="h-32 flex items-center justify-center text-[var(--text-muted)] text-[0.875rem]">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-[0.875rem]">No projects created yet.</div>
            ) : (
              projects.slice(0, 3).map((project) => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const projDone = projectTasks.filter(t => t.status === 'DONE').length;
                const pct = projectTasks.length > 0 ? Math.round((projDone / projectTasks.length) * 100) : 0;
                return (
                  <div key={project.id} className="p-4 bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-[var(--radius-btn)]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-[var(--text-primary)] text-[0.875rem]">{project.name}</span>
                      <span className="text-[0.75rem] font-medium text-[var(--text-secondary)] bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-[4px]">
                        {projectTasks.length} tasks
                      </span>
                    </div>
                    <div className="w-full bg-[rgba(255,255,255,0.05)] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[var(--brand)] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] mb-1">Recent Tasks</h3>
            <p className="text-[var(--text-muted)] text-[0.8125rem]">A snapshot of recent activity</p>
          </div>
          <Link href="/tasks" className="text-[0.8125rem] font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] flex items-center gap-1 transition-colors">
            Go to Kanban <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">Task Name</th>
                <th className="pb-3 px-4">Project</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Priority</th>
                <th className="pb-3 pl-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[0.875rem]">
              {tasksLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">No tasks assigned to you.</td>
                </tr>
              ) : (
                tasks.slice(0, 5).map((task) => {
                  const statusConf = statusConfig[task.status];
                  const prioConf = priorityConfig[task.priority];
                  return (
                    <tr key={task.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                      <td className="py-3.5 pr-4 font-medium text-[var(--text-primary)]">{task.title}</td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">{task.project?.name || 'Unassigned'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`badge ${statusConf.bg} ${statusConf.text}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge ${prioConf.bg} ${prioConf.text} uppercase`}>
                          {prioConf.label}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-[var(--text-secondary)]">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation Dialog */}
      <CreateTaskDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </DashboardLayout>
  );
}
