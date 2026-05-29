'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useTasks, useUpdateTaskStatus } from '@/hooks/use-tasks';
import { useProjects, useUsers } from '@/hooks/use-data';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuthStore } from '@/store/auth';
import { 
  Search, 
  Plus, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { statusConfig, priorityConfig } from '@/lib/utils';
import EditTaskDialog from '@/components/edit-task-dialog';
import CreateTaskDialog from '@/components/create-task-dialog';
import type { Task } from '@/lib/types';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', borderColor: 'border-[var(--border-subtle)]' },
  { id: 'IN_PROGRESS', title: 'In Progress', borderColor: 'border-[rgba(59,130,246,0.3)]' },
  { id: 'IN_REVIEW', title: 'In Review', borderColor: 'border-[rgba(245,158,11,0.3)]' },
  { id: 'DONE', title: 'Done', borderColor: 'border-[rgba(34,197,94,0.3)]' },
  { id: 'BLOCKED', title: 'Blocked', borderColor: 'border-[rgba(239,68,68,0.3)]' },
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('task-search-input')?.focus();
      }
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
      toast.success(`Task status updated`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid status transition');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-[0.875rem]">Manage and track tasks in real time.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFilters}
            className="btn-secondary flex items-center gap-1.5"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="card p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks... (Cmd+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="input cursor-pointer appearance-none"
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
            className="input cursor-pointer appearance-none disabled:opacity-50"
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
            className="input cursor-pointer appearance-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div className="flex gap-6 pb-12 overflow-x-auto snap-x">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          const colConf = statusConfig[column.id];
          
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="flex flex-col min-w-[320px] w-[320px] h-[calc(100vh-300px)] min-h-[500px] bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-4 shrink-0 snap-start"
            >
              {/* Column Header */}
              <div className={`flex justify-between items-center mb-4 pb-3 border-b border-[var(--border-subtle)] border-t-[3px] border-t-transparent ${column.borderColor.replace('border-', 'border-t-')}`}>
                <div className="flex items-center gap-2">
                  <div className={`status-dot ${colConf.dot}`}></div>
                  <span className="font-semibold text-[0.875rem] text-[var(--text-primary)]">{column.title}</span>
                </div>
                <span className="text-[0.6875rem] font-medium px-2 py-0.5 rounded-[4px] bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Cards scroll list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                {tasksLoading ? (
                  <div className="text-center py-8 text-[0.75rem] text-[var(--text-muted)] animate-pulse">Loading...</div>
                ) : columnTasks.length === 0 ? (
                  <div className="border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-btn)] py-8 text-center text-[0.75rem] text-[var(--text-muted)]">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    const prioConf = priorityConfig[task.priority];
                    
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleCardClick(task)}
                        className="card p-4 cursor-grab active:cursor-grabbing group hover:-translate-y-0.5"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2.5">
                          <span className={`badge ${prioConf.bg} ${prioConf.text} uppercase`}>
                            {prioConf.label}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-[0.6875rem] font-medium text-[#EF4444]">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </span>
                          )}
                        </div>

                        <h4 className="font-medium text-[var(--text-primary)] text-[0.875rem] mb-1.5 group-hover:text-[var(--brand)] transition-colors line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="text-[0.75rem] text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-subtle)] mt-2">
                          <div className="flex justify-between items-center text-[0.75rem]">
                            <span className="text-[var(--text-muted)] bg-[rgba(255,255,255,0.02)] px-2 py-1 rounded-[4px] max-w-[130px] truncate border border-[var(--border-subtle)]">
                              {task.project?.name || 'No Project'}
                            </span>

                            <div className="flex items-center gap-1.5 bg-[rgba(255,255,255,0.02)] pl-2 pr-1 py-1 rounded-full border border-[var(--border-subtle)]">
                              <span className="text-[var(--text-secondary)] font-medium truncate max-w-[80px] text-[0.6875rem]">
                                {task.assignee?.name || 'Unassigned'}
                              </span>
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] font-semibold text-[var(--text-primary)] text-[0.5rem]">
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
