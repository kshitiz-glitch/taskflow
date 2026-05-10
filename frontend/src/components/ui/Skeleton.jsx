import { cn } from '@/utils/helpers';

export function Skeleton({ className }) {
  return (
    <div className={cn('shimmer-base rounded-lg', className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonKanbanCol() {
  return (
    <div className="bg-surface-800/50 rounded-xl p-4 space-y-3 min-w-[280px]">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface-800 rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="w-7 h-7 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
