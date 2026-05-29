'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useTasks, useUpdateTaskStatus } from '@/hooks/use-tasks';
import { useProjects, useUsers } from '@/hooks/use-data';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuthStore } from '@/store/auth';
import { 
  KanbanSquare, 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  User as UserIcon,
  RotateCcw
} from 'lucide-react';
import { statusColors, priorityColors } from '@/lib/utils';
import EditTaskDialog from '@/components/edit-task-dialog';
import CreateTaskDialog from '@/components/create-task-dialog';
import type { Task } from '@/lib/types';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-900 border-slate-800' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-slate-900 border-blue-900/20' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-slate-900 border-amber-900/20' },
  { id: 'DONE', title: 'Done', color: 'bg-slate-900 border-emerald-900/20' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-slate-900 border-red-900/20' },
];

export default function TasksPage() {
  const { user } = useAuthStore();
  const updateTaskStatus = useUpdateTaskStatus();

  // Filters State
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');

  // Dialog State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('task-search-input')?.focus();
      }
      // 'n' or 'N' to open new task modal
      if ((e.key === 'n' || e.key === 'N') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
          e.preventDefault();
          setIsCreateOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Fetch lists
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    projectId: projectId || undefined,
    assigneeId: assigneeId || undefined,
    priority: priority || undefined,
    search: debouncedSearch || undefined,
    limit: 100
  });

  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const tasks = tasksData?.data || [];
  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const handleResetFilters = () => {
    setProjectId('');
    setAssigneeId('');
    setPriority('');
    setSearch('');
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    try {
      await updateTaskStatus.mutateAsync({ id: taskId, status: targetStatus });
      toast.success(`Task status updated to ${targetStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid status transition');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Kanban Board</h1>
          <p className="text-slate-400 mt-1">Manage and track tasks in real time.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="glass-panel p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks... (Cmd+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-10 pr-4 py-2 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all"
          />
        </div>

        <div>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-slate-100 text-sm outline-none transition-all cursor-pointer"
          >
            <option value="">All Projects</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={assigneeId}
            disabled={user?.role === 'MEMBER'}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-slate-100 text-sm outline-none transition-all cursor-pointer disabled:opacity-50"
          >
            {user?.role === 'MEMBER' ? (
              <option value={user.id}>Assigned to me</option>
            ) : (
              <>
                <option value="">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-slate-100 text-sm outline-none transition-all cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
        </div>
      </div>

      {/* ─── KANBAN BOARD COLUMNS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex flex-col h-[600px] bg-slate-950/30 border border-slate-900/60 rounded-2xl p-4 overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900/50">
                <span className="font-bold text-sm text-slate-200">{column.title}</span>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Cards scroll list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {tasksLoading ? (
                  <div className="text-center py-8 text-xs text-slate-600 animate-pulse">Loading...</div>
                ) : columnTasks.length === 0 ? (
                  <div className="border border-dashed border-slate-900 rounded-xl py-8 text-center text-xs text-slate-600">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleCardClick(task)}
                        className="glass-card p-4 rounded-xl border border-slate-900 bg-slate-900/20 cursor-grab active:cursor-grabbing hover:border-slate-800 hover:bg-slate-900/40 transition-all duration-200 relative group"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-3xs font-semibold uppercase ${
                            task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {task.priority}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-3xs font-semibold text-red-400">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-slate-200 text-sm mb-1 group-hover:text-white line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-col gap-2 pt-3 border-t border-slate-950/40 text-3xs">
                          {/* Project Tag */}
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 bg-slate-950/50 px-2 py-1 rounded-md max-w-[130px] truncate border border-slate-800/50">
                              {task.project?.name || 'No Project'}
                            </span>

                            {/* Assignee / Initials */}
                            <div className="flex items-center gap-1.5 bg-slate-900/50 pl-2 pr-1 py-1 rounded-full border border-slate-800/50">
                              <span className="text-slate-400 font-medium truncate max-w-[80px]">
                                {task.assignee?.name || 'Unassigned'}
                              </span>
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30 font-bold text-indigo-300">
                                {(task.assignee?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation Dialog */}
      <CreateTaskDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Task Edit Dialog */}
      <EditTaskDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        task={selectedTask}
      />
    </DashboardLayout>
  );
}
