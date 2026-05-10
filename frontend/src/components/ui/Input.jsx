import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(function Input({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'input-base',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-surface-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-surface-500">{hint}</p>
      )}
    </div>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea({ label, error, hint, className, rows = 3, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'input-base resize-none',
          error && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-surface-500">{hint}</p>
      )}
    </div>
  );
});
