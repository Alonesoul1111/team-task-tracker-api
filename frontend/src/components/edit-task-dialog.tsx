'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateTask, useUpdateTaskStatus, useDeleteTask } from '@/hooks/use-tasks';
import { useProjects, useUsers } from '@/hooks/use-data';
import { useComments, useAddComment, useSubTasks, useAddSubTask, useUpdateSubTask, useDeleteSubTask } from '@/hooks/use-task-details';
import { toast } from 'sonner';
import { X, Trash2, CheckCircle2, Circle, MessageSquare, Plus } from 'lucide-react';
import type { Task } from '@/lib/types';
import { useAuthStore } from '@/store/auth';

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function EditTaskDialog({ isOpen, onClose, task }: EditTaskDialogProps) {
  const updateTask = useUpdateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const { user } = useAuthStore();

  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const { data: comments = [] } = useComments(task?.id);
  const { data: subTasks = [] } = useSubTasks(task?.id);
  
  const addComment = useAddComment();
  const addSubTask = useAddSubTask();
  const updateSubTask = useUpdateSubTask();
  const deleteSubTask = useDeleteSubTask();

  const [newComment, setNewComment] = useState('');
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED'>('TODO');

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'MEDIUM');
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
      setStatus(task.status || 'TODO');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const projects = projectsData?.data || [];
  const users = usersData?.data || [];

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        id: task.id,
        title,
        description,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      await updateTask.mutateAsync(payload);
      toast.success('Task details updated');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task details');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateTaskStatus.mutateAsync({ id: task.id, status: newStatus });
      setStatus(newStatus as any);
      toast.success(`Task status updated to ${newStatus}`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid status transition');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setIsDeleting(true);
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    try {
      await addComment.mutateAsync({ taskId: task.id, content: newComment });
      setNewComment('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim() || !task) return;
    try {
      await addSubTask.mutateAsync({ taskId: task.id, title: newSubTaskTitle });
      setNewSubTaskTitle('');
    } catch (err) {
      toast.error('Failed to add subtask');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-950/90 rounded-2xl border border-slate-800/60 shadow-2xl overflow-hidden ring-1 ring-white/5">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800/60 bg-slate-900/40">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                ✎
              </span>
              Edit Task
            </h3>
            <span className="text-2xs text-slate-500 font-mono ml-10">ID: {task.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || task.creatorId === user?.id) && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          
          {/* Status quick action board */}
          <div className="mb-8 p-5 bg-slate-900/40 border border-slate-800/50 rounded-xl shadow-inner">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Update Status (Transition rules apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'].map((st) => {
                const isActive = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          <form id="edit-task-form" onSubmit={handleUpdateDetails} className="space-y-6">
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

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
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

          {/* Sub-tasks Section */}
          <div className="mt-10 pt-8 border-t border-slate-800/60">
            <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              Sub-tasks
            </h4>
            <div className="space-y-2 mb-4">
              {subTasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-800 rounded-xl group hover:bg-slate-900/60 transition-all">
                  <button 
                    onClick={() => updateSubTask.mutate({ taskId: task!.id, subTaskId: st.id, isDone: !st.isDone })}
                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {st.isDone ? <CheckCircle2 className="h-5 w-5 text-indigo-500" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <span className={`flex-1 text-sm ${st.isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {st.title}
                  </span>
                  <button 
                    onClick={() => deleteSubTask.mutate({ taskId: task!.id, subTaskId: st.id })}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSubTask} className="flex gap-2">
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="Add a new sub-task..."
                className="flex-1 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-slate-100 text-sm outline-none shadow-inner"
              />
              <button 
                type="submit" 
                disabled={addSubTask.isPending || !newSubTaskTitle.trim()}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Comments Section */}
          <div className="mt-10 pt-8 border-t border-slate-800/60">
            <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              Comments
            </h4>
            <div className="space-y-4 mb-6">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300 mt-1 border border-slate-700">
                    {c.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-slate-900/50 p-3 rounded-tr-xl rounded-b-xl border border-slate-800/60">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-300">{c.user.name}</span>
                      <span className="text-2xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet. Start the conversation!</p>
              )}
            </div>
            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none resize-none shadow-inner mb-2"
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={addComment.isPending || !newComment.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  Post Comment
                </button>
              </div>
            </form>
          </div>

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
            form="edit-task-form"
            disabled={updateTask.isPending}
            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            {updateTask.isPending ? 'Saving...' : 'Save Details'}
          </button>
        </div>

      </div>
    </div>
  );
}
