import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date) => {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateShort = (date) => {
  if (!date) return null;
  return format(new Date(date), 'MMM d');
};

export const formatDateTime = (date) => {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
};

export const formatRelative = (date) => {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getDueDateLabel = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', variant: 'danger' };
  if (isToday(d)) return { label: 'Due today', variant: 'warning' };
  if (isTomorrow(d)) return { label: 'Due tomorrow', variant: 'warning' };
  const diff = differenceInDays(d, new Date());
  if (diff <= 3) return { label: `${diff}d left`, variant: 'warning' };
  return { label: formatDateShort(d), variant: 'default' };
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const TASK_STATUS = {
  TODO: { label: 'To Do', color: 'text-surface-400', bg: 'bg-surface-700/60', dot: 'bg-surface-500', border: 'border-surface-600' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400', border: 'border-blue-500/30' },
  IN_REVIEW: { label: 'In Review', color: 'text-violet-400', bg: 'bg-violet-500/10', dot: 'bg-violet-400', border: 'border-violet-500/30' },
  DONE: { label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', border: 'border-emerald-500/30' },
};

export const TASK_PRIORITY = {
  LOW: { label: 'Low', color: 'text-surface-400', bg: 'bg-surface-700/60', icon: '▼' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: '◆' },
  HIGH: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '▲' },
  URGENT: { label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', icon: '⚡' },
};

export const PROJECT_STATUS = {
  ACTIVE: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  ON_HOLD: { label: 'On Hold', color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
  COMPLETED: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400' },
  ARCHIVED: { label: 'Archived', color: 'text-surface-500', bg: 'bg-surface-700/60', dot: 'bg-surface-500' },
};

export const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-teal-500',
];

export const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const truncate = (str, length = 60) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
};
