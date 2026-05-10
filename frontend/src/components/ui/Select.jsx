import { forwardRef } from 'react';
import { cn } from '@/utils/helpers';
import { ChevronDown, AlertCircle } from 'lucide-react';

const Select = forwardRef(function Select({ label, error, hint, className, children, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'input-base appearance-none pr-10 cursor-pointer',
            error && 'border-red-500/50 focus:ring-red-500/30',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-surface-500">
          <ChevronDown className="w-4 h-4" />
        </div>
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

export default Select;
