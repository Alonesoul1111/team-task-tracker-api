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
  Calendar, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import CreateTaskDialog from '@/components/create-task-dialog';
import { statusColors } from '@/lib/utils';

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
    { name: 'To Do', value: todoCount, icon: KanbanSquare, color: 'text-slate-400 border-slate-900' },
    { name: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-blue-400 border-blue-900/40' },
    { name: 'In Review', value: inReviewCount, icon: TrendingUp, color: 'text-amber-400 border-amber-900/40' },
    { name: 'Done', value: doneCount, icon: CheckCircle2, color: 'text-emerald-400 border-emerald-900/40' },
    { name: 'Blocked', value: blockedCount, icon: AlertTriangle, color: 'text-red-400 border-red-900/40' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Dashboard</h1>
          <p className="text-slate-400 mt-1">Hello, {user.name}. Here is what is happening today.</p>
        </div>

        {/* Create Task Button (ADMIN & MANAGER only) */}
        {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            New Task
          </button>
        )}
      </div>

      {/* Overdue alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-200">Attention: {overdueTasks.length} Overdue Tasks</h4>
            <p className="text-red-300/80 text-sm mt-0.5">Please review the blocked or unfinished tasks that missed their deadlines.</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-5 rounded-2xl border bg-slate-900/10">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.name}</span>
              <stat.icon className={`h-5 w-5 ${stat.color.split(' ')[0]}`} />
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Progress & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress circular representation */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Completion Progress</h3>
            <p className="text-slate-500 text-xs">Total task conversion metrics</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center h-32 w-32">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-slate-900 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-indigo-500 fill-none transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray={351.8}
                  strokeDashoffset={351.8 - (351.8 * completionRate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-2xl font-extrabold text-slate-100">{completionRate}%</div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 bg-slate-950/40 py-2.5 rounded-xl border border-slate-900/60">
            {doneCount} of {totalTasks} tasks resolved
          </div>
        </div>

        {/* Project breakdown cards */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Projects Overview</h3>
              <p className="text-slate-500 text-xs">Current active project details</p>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {projectsLoading ? (
              <div className="h-32 flex items-center justify-center text-slate-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No projects created yet.</div>
            ) : (
              projects.slice(0, 3).map((project) => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const projDone = projectTasks.filter(t => t.status === 'DONE').length;
                const pct = projectTasks.length > 0 ? Math.round((projDone / projectTasks.length) * 100) : 0;
                return (
                  <div key={project.id} className="p-4 bg-slate-950/40 border border-slate-900/60 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-200 text-sm">{project.name}</span>
                      <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded-md">
                        {projectTasks.length} tasks
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Recent Tasks</h3>
            <p className="text-slate-500 text-xs">A snapshot of recent activity</p>
          </div>
          <Link href="/tasks" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            Go to Kanban <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3 pr-4">Task Name</th>
                <th className="pb-3 px-4">Project</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Priority</th>
                <th className="pb-3 pl-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm">
              {tasksLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No tasks assigned to you.</td>
                </tr>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <tr key={task.id} className="hover:bg-slate-900/20 group">
                    <td className="py-3.5 pr-4 font-semibold text-slate-200">{task.title}</td>
                    <td className="py-3.5 px-4 text-slate-400">{task.project?.name || 'Unassigned'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${statusColors[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase ${
                        task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-slate-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </td>
                  </tr>
                ))
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
