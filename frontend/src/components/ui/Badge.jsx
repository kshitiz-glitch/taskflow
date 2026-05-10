import { cn } from '@/utils/helpers';
import { TASK_STATUS, TASK_PRIORITY, PROJECT_STATUS } from '@/utils/helpers';

export function StatusBadge({ status, type = 'task', className }) {
  const map = type === 'project' ? PROJECT_STATUS : TASK_STATUS;
  const config = map[status] || { label: status, color: 'text-surface-400', bg: 'bg-surface-700/60', dot: 'bg-surface-500' };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.bg, config.color,
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }) {
  const config = TASK_PRIORITY[priority] || { label: priority, color: 'text-surface-400', bg: 'bg-surface-700', icon: '◆' };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
      config.bg, config.color,
      className
    )}>
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-surface-700/60 text-surface-300',
    primary: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
