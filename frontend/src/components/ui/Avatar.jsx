import { getInitials, getAvatarColor, cn } from '@/utils/helpers';

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
  '2xl': 'w-20 h-20 text-2xl',
};

export default function Avatar({ user, size = 'md', className, showRing = false }) {
  const name = user?.name || user || '';
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizes[size],
          showRing && 'ring-2 ring-brand-500/50',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        colorClass,
        sizes[size],
        showRing && 'ring-2 ring-brand-500/50',
        className
      )}
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <Avatar
          key={user.id || i}
          user={user}
          size={size}
          className="ring-2 ring-surface-800"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-surface-300 bg-surface-700 ring-2 ring-surface-800 flex-shrink-0',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
