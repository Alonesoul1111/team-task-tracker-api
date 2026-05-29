'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import { useProjects, useUsers } from '@/hooks/use-data';
import { toast } from 'sonner';
import { X, Trash2 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { useAuthStore } from '@/store/auth';

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function EditTaskDialog({ isOpen, onClose, task }: EditTaskDialogProps) {
  const { user } = useAuthStore();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [status, setStatus] = useState<string>('TODO');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setProjectId(task.projectId);
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
      setIsConfirmDeleteOpen(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || task.assigneeId === user?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!title || !projectId) {
      toast.error('Title and Project are required');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        title,
        description,
        priority,
        status: status as any,
        projectId,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      toast.success('Task updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden ring-1 ring-white/5 mx-4">
          
          {/* Header - Sticky */}
          <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
            <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="h-7 w-7 rounded-[6px] bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] text-xs font-mono uppercase tracking-wider">
                ID
              </span>
              {task.id.slice(0, 8)}...
            </h3>
            <div className="flex items-center gap-2">
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="p-1.5 rounded-[var(--radius-btn)] text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#EF4444] transition-all cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-[var(--radius-btn)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
            <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                  Task Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canEdit}
                  className="input disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEdit}
                  rows={4}
                  className="input resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canEdit}
                    className="input cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    disabled={!canEdit}
                    className="input cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="LOW" className="text-[#22C55E]">Low</option>
                    <option value="MEDIUM" className="text-[#F59E0B]">Medium</option>
                    <option value="HIGH" className="text-[#EF4444]">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Project <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={!canEdit}
                    className="input cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>Select Project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={!canEdit && user?.role !== 'MANAGER' && user?.role !== 'ADMIN'}
                    className="input cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={!canEdit}
                    onClick={(e) => {
                      if (canEdit) {
                        try {
                          if ('showPicker' in HTMLInputElement.prototype) {
                            e.currentTarget.showPicker();
                          }
                        } catch (err) {}
                      }
                    }}
                    className="input cursor-pointer [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              
            </form>
          </div>

          {/* Footer - Sticky */}
          <div className="flex justify-end gap-3 p-6 border-t border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)] mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                type="submit"
                form="edit-task-form"
                disabled={updateTask.isPending}
                className="btn-primary"
              >
                {updateTask.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Internal Delete Confirmation Dialog */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(11,17,32,0.85)] backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-2xl p-6 ring-1 ring-white/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-[rgba(239,68,68,0.12)] rounded-[10px]">
                <Trash2 className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Delete this task?</h3>
                <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-[0.875rem] text-[var(--text-secondary)] mb-6 leading-relaxed">
              Are you sure you want to permanently delete the task <strong className="text-[var(--text-primary)]">&quot;{task.title}&quot;</strong>? All associated data will be removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="btn-danger flex items-center gap-2"
              >
                {deleteTask.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
