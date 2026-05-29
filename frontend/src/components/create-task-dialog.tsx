'use client';

import React, { useState } from 'react';
import { useCreateTask } from '@/hooks/use-tasks';
import { useProjects, useUsers } from '@/hooks/use-data';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTaskDialog({ isOpen, onClose }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId) {
      toast.error('Title and Project are required');
      return;
    }

    try {
      const payload: any = {
        title,
        description,
        priority,
        projectId,
      };

      if (assigneeId) payload.assigneeId = assigneeId;
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();

      await createTask.mutateAsync(payload);
      toast.success('Task created successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setProjectId('');
      setAssigneeId('');
      setDueDate('');
      
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden ring-1 ring-white/5 mx-4">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
          <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span className="h-7 w-7 rounded-[6px] bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand)] text-lg leading-none">
              +
            </span>
            Create New Task
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-[var(--radius-btn)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                Task Title <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design homepage wireframe"
                className="input"
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
                placeholder="Add detailed task description..."
                rows={4}
                className="input resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                  Project <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="input cursor-pointer appearance-none"
                  required
                >
                  <option value="" disabled className="text-[var(--text-muted)]">Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id} className="bg-[var(--bg-card)]">
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
                  className="input cursor-pointer appearance-none"
                >
                  <option value="" className="text-[var(--text-muted)]">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[var(--bg-card)]">
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="input cursor-pointer appearance-none"
                >
                  <option value="LOW" className="bg-[var(--bg-card)] text-[#22C55E]">Low</option>
                  <option value="MEDIUM" className="bg-[var(--bg-card)] text-[#F59E0B]">Medium</option>
                  <option value="HIGH" className="bg-[var(--bg-card)] text-[#EF4444]">High</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setDueDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        e.currentTarget.showPicker();
                      }
                    } catch (err) {}
                  }}
                  className="input cursor-pointer [color-scheme:dark]"
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
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={createTask.isPending}
            className="btn-primary"
          >
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  );
}
