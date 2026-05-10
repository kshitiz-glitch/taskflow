import { NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, User,
  LogOut, ChevronRight, Zap, Shield, X
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-brand-500/15 text-brand-400 shadow-sm'
            : 'text-surface-400 hover:text-surface-100 hover:bg-surface-700/60'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-brand-400' : 'text-surface-500 group-hover:text-surface-300')} />
          <span>{label}</span>
          {isActive && (
            <motion.span
              layoutId="activeIndicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/login');
    toast.success('Signed out successfully');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-30 flex flex-col',
        'bg-surface-900 border-r border-surface-800',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-surface-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-surface-50 tracking-tight">TaskFlow</span>
              <div className="text-[10px] text-surface-500 leading-none">Team Manager</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-surface-800 text-surface-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-gradient-card border border-surface-700/40">
          <div className="flex items-center gap-2.5">
            <Avatar user={user} size="md" showRing />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-100 truncate">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {user?.role === 'ADMIN' ? (
                  <Shield className="w-3 h-3 text-brand-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-surface-500" />
                )}
                <span className="text-xs text-surface-500 capitalize">{user?.role?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-600">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={onClose} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-2 border-t border-surface-800 mt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
