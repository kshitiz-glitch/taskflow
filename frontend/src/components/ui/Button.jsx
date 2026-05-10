import { cn } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'border border-surface-600 hover:border-brand-500/50 text-surface-300 hover:text-surface-100 hover:bg-surface-700/40 font-medium px-4 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98]',
};

const sizes = {
  xs: 'text-xs px-2.5 py-1.5',
  sm: 'text-sm px-3 py-2',
  md: 'text-sm',
  lg: 'text-base px-5 py-3',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}) {
  return (
    <button
      className={cn(variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="inline-flex items-center gap-2">
          {leftIcon}
          {children}
        </span>
      ) : rightIcon ? (
        <span className="inline-flex items-center gap-2">
          {children}
          {rightIcon}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
