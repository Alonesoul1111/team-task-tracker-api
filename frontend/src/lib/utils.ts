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

export const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  TODO:        { label: 'To Do',       dot: 'bg-[#64748B]', text: 'text-[#64748B]', bg: 'bg-[rgba(100,116,139,0.12)]' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-[#3B82F6]', text: 'text-[#3B82F6]', bg: 'bg-[rgba(59,130,246,0.12)]' },
  IN_REVIEW:   { label: 'In Review',   dot: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', bg: 'bg-[rgba(245,158,11,0.12)]' },
  DONE:        { label: 'Done',        dot: 'bg-[#22C55E]', text: 'text-[#22C55E]', bg: 'bg-[rgba(34,197,94,0.12)]' },
  BLOCKED:     { label: 'Blocked',     dot: 'bg-[#EF4444]', text: 'text-[#EF4444]', bg: 'bg-[rgba(239,68,68,0.12)]' },
};

export const priorityConfig: Record<string, { label: string; text: string; bg: string; icon: string }> = {
  LOW:    { label: 'Low',    text: 'text-[#22C55E]', bg: 'bg-[rgba(34,197,94,0.12)]',  icon: '↓' },
  MEDIUM: { label: 'Medium', text: 'text-[#F59E0B]', bg: 'bg-[rgba(245,158,11,0.12)]', icon: '→' },
  HIGH:   { label: 'High',   text: 'text-[#EF4444]', bg: 'bg-[rgba(239,68,68,0.12)]',  icon: '↑' },
};

// Keep backward compat for older references
export const statusColors: Record<string, string> = Object.fromEntries(
  Object.entries(statusConfig).map(([k, v]) => [k, `${v.bg} ${v.text}`])
);
export const statusLabels: Record<string, string> = Object.fromEntries(
  Object.entries(statusConfig).map(([k, v]) => [k, v.label])
);
export const priorityColors: Record<string, string> = Object.fromEntries(
  Object.entries(priorityConfig).map(([k, v]) => [k, `${v.bg} ${v.text}`])
);
export const priorityIcons: Record<string, string> = Object.fromEntries(
  Object.entries(priorityConfig).map(([k, v]) => [k, v.icon])
);
