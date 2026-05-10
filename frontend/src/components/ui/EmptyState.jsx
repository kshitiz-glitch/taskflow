import { cn } from '@/utils/helpers';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-700/40 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-surface-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-surface-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 max-w-sm mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
