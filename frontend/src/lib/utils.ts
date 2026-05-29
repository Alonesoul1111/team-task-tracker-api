import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days left`;
  return formatDate(date);
}

export const statusColors: Record<string, string> = {
  TODO: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DONE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  BLOCKED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export const statusLabels: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

export const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  HIGH: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export const priorityIcons: Record<string, string> = {
  LOW: '↓',
  MEDIUM: '→',
  HIGH: '↑',
};
