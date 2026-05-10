import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, X, FolderKanban, CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { projectApi, taskApi } from '@/utils/api';
import { cn, formatDate, getDueDateLabel, TASK_STATUS } from '@/utils/helpers';
import { StatusBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import useAuthStore from '@/store/authStore';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your workspace' },
  '/projects': { title: 'Projects', subtitle: 'Manage your projects and teams' },
  '/tasks': { title: 'My Tasks', subtitle: 'All tasks assigned to you' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account settings' },
};

// ─── Search Panel ────────────────────────────────────────────────────────────

function SearchPanel({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['search-projects', query],
    queryFn: () => projectApi.getAll({ search: query }),
    enabled: query.length > 1,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['search-tasks', query],
    queryFn: () => taskApi.getAll({ search: query }),
    enabled: query.length > 1,
  });

  const projects = projectsData?.data?.slice(0, 4) || [];
  const tasks = tasksData?.data?.slice(0, 5) || [];
  const hasResults = projects.length > 0 || tasks.length > 0;
  const isLoading = projectsLoading || tasksLoading;

  const goTo = (path) => { navigate(path); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Search box */}
      <div className="relative z-10 max-w-2xl w-full mx-auto mt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.15 }}
          className="glass-card overflow-hidden"
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-700/60">
            <Search className="w-4.5 h-4.5 text-surface-500 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects and tasks..."
              className="flex-1 bg-transparent text-surface-100 placeholder-surface-500 text-sm focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-surface-500 hover:text-surface-300">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs text-surface-600 bg-surface-800 border border-surface-700">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length < 2 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="w-8 h-8 text-surface-700 mb-2" />
                <p className="text-sm text-surface-500">Type at least 2 characters to search</p>
              </div>
            )}

            {query.length >= 2 && isLoading && (
              <div className="py-8 text-center text-sm text-surface-500">Searching...</div>
            )}

            {query.length >= 2 && !isLoading && !hasResults && (
              <div className="py-8 text-center text-sm text-surface-500">
                No results for "<span className="text-surface-300">{query}</span>"
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-surface-600">
                  Projects
                </p>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => goTo(`/projects/${project.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-700/40 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-4 h-4 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">{project.name}</p>
                      <p className="text-xs text-surface-500">{project._count?.tasks} tasks · {project.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-surface-600">
                  Tasks
                </p>
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => goTo(`/projects/${task.project?.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-700/40 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-700/60 flex items-center justify-center flex-shrink-0">
                      <CheckSquare className="w-4 h-4 text-surface-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">{task.title}</p>
                      <p className="text-xs text-surface-500 truncate">{task.project?.name}</p>
                    </div>
                    <StatusBadge status={task.status} className="flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {hasResults && (
              <div className="px-4 py-2.5 border-t border-surface-700/50">
                <p className="text-xs text-surface-600">
                  {projects.length + tasks.length} results — press <kbd className="px-1 py-0.5 rounded bg-surface-700 text-surface-400 text-[10px]">Enter</kbd> to search in full
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Notifications Panel ─────────────────────────────────────────────────────

function NotificationsPanel({ onClose }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const { data: overdueData } = useQuery({
    queryKey: ['notifications-overdue'],
    queryFn: () => taskApi.getAll({ overdue: 'true' }),
  });

  const { data: mineData } = useQuery({
    queryKey: ['notifications-mine', user?.id],
    queryFn: () => taskApi.getAll({ assigneeId: user?.id }),
  });

  const overdue = overdueData?.data?.slice(0, 5) || [];

  const dueSoon = (mineData?.data || []).filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    const diff = (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  }).slice(0, 5);

  const total = overdue.length + dueSoon.length;

  const goTo = (path) => { navigate(path); onClose(); };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 glass-card shadow-card-hover overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-surface-400" />
          <span className="text-sm font-semibold text-surface-100">Notifications</span>
          {total > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">
              {total}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-surface-500 hover:text-surface-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {total === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="w-8 h-8 text-surface-700 mb-2" />
            <p className="text-sm text-surface-500">You're all caught up!</p>
            <p className="text-xs text-surface-600 mt-0.5">No overdue or due-soon tasks</p>
          </div>
        )}

        {overdue.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-500">
              Overdue · {overdue.length}
            </p>
            {overdue.map((task) => (
              <button
                key={task.id}
                onClick={() => goTo(`/projects/${task.project?.id}`)}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-700/40 transition-colors text-left"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{task.title}</p>
                  <p className="text-xs text-red-400 mt-0.5">
                    Due {formatDate(task.dueDate)} · {task.project?.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {dueSoon.length > 0 && (
          <div className={cn(overdue.length > 0 && 'border-t border-surface-700/50')}>
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-500">
              Due Soon · {dueSoon.length}
            </p>
            {dueSoon.map((task) => (
              <button
                key={task.id}
                onClick={() => goTo(`/projects/${task.project?.id}`)}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-700/40 transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{task.title}</p>
                  <p className="text-xs text-amber-400 mt-0.5">
                    Due {formatDate(task.dueDate)} · {task.project?.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="px-4 py-2.5 border-t border-surface-700/50">
          <button
            onClick={() => goTo('/tasks')}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            View all tasks →
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const { data: overdueData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => taskApi.getAll({ overdue: 'true' }),
    refetchInterval: 60000,
  });
  const notifCount = overdueData?.data?.length || 0;

  const getPageInfo = () => {
    if (location.pathname.startsWith('/projects/')) {
      return { title: 'Project Detail', subtitle: 'Tasks and team members' };
    }
    return pageTitles[location.pathname] || { title: 'TaskFlow', subtitle: '' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-surface-900/80 backdrop-blur-xl border-b border-surface-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-800 text-surface-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-surface-50 leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-surface-500 leading-tight hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            title="Search (type to find projects & tasks)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'p-2 rounded-lg transition-colors relative',
                showNotifications
                  ? 'bg-surface-700 text-surface-200'
                  : 'hover:bg-surface-800 text-surface-400 hover:text-surface-200'
              )}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-surface-900" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationsPanel onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
      </AnimatePresence>
    </>
  );
}
