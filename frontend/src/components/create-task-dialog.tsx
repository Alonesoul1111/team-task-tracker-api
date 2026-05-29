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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-950/90 rounded-2xl border border-slate-800/60 shadow-2xl overflow-hidden ring-1 ring-white/5">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800/60 bg-slate-900/40">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              +
            </span>
            Create New Task
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design homepage wireframe"
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add detailed task description..."
                rows={4}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all resize-none shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl border border-slate-800/50 bg-slate-900/20">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Project <span className="text-red-400">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all cursor-pointer shadow-inner appearance-none"
                  required
                >
                  <option value="" disabled className="text-slate-500">Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id} className="bg-slate-900 text-slate-200">
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all cursor-pointer shadow-inner appearance-none"
                >
                  <option value="" className="text-slate-500">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all cursor-pointer shadow-inner appearance-none"
                >
                  <option value="LOW" className="bg-slate-900 text-slate-200">Low</option>
                  <option value="MEDIUM" className="bg-slate-900 text-slate-200">Medium</option>
                  <option value="HIGH" className="bg-slate-900 text-slate-200">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
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
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition-all cursor-pointer shadow-inner [color-scheme:dark]"
                />
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-800/60 bg-slate-900/40 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={createTask.isPending}
            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  );
}
