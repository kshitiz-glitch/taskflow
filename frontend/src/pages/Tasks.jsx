import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckSquare, Filter, Search, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { taskApi } from '@/utils/api';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, getDueDateLabel, cn } from '@/utils/helpers';
import useAuthStore from '@/store/authStore';

const TABS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'mine', label: 'Assigned to me' },
  { id: 'overdue', label: 'Overdue' },
];

function TaskRow({ task, index }) {
  const due = getDueDateLabel(task.dueDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 hover:bg-surface-700/25 transition-colors border-b border-surface-700/40 last:border-0"
    >
      {/* Status dot + title */}
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <StatusBadge status={task.status} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-200 group-hover:text-surface-50 transition-colors truncate">
            {task.title}
          </p>
          {task.project && (
            <Link
              to={`/projects/${task.project.id}`}
              className="text-xs text-brand-400/70 hover:text-brand-400 transition-colors mt-0.5 inline-block"
            >
              {task.project.name}
            </Link>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <PriorityBadge priority={task.priority} />

        {task.assignee ? (
          <div className="hidden sm:flex items-center gap-1.5">
            <Avatar user={task.assignee} size="xs" />
            <span className="text-xs text-surface-500">{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="hidden sm:block text-xs text-surface-600">Unassigned</span>
        )}

        {task.dueDate && due ? (
          <div className={cn(
            'hidden sm:flex items-center gap-1 text-xs',
            due.variant === 'danger' ? 'text-red-400' : due.variant === 'warning' ? 'text-amber-400' : 'text-surface-500'
          )}>
            <Calendar className="w-3.5 h-3.5" />
            {due.label}
          </div>
        ) : (
          <span className="hidden sm:block text-xs text-surface-700 w-16">—</span>
        )}
      </div>
    </motion.div>
  );
}

export default function Tasks() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const queryParams = {
    ...(activeTab === 'mine' && { assigneeId: user?.id }),
    ...(activeTab === 'overdue' && { overdue: 'true' }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => taskApi.getAll(queryParams),
  });

  const tasks = data?.data || [];

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const groupedByStatus = {
    TODO: filtered.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: filtered.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: filtered.filter((t) => t.status === 'IN_REVIEW'),
    DONE: filtered.filter((t) => t.status === 'DONE'),
  };

  const overdueCount = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'DONE') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="section-title">Tasks</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
            {overdueCount > 0 && (
              <span className="text-red-400 ml-2">· {overdueCount} overdue</span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all',
              activeTab === tab.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-surface-500 hover:text-surface-300'
            )}
          >
            {tab.label}
            {tab.id === 'overdue' && overdueCount > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">{overdueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        <Input
          placeholder="Search tasks..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-36">
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
      </motion.div>

      {/* Task list */}
      {isLoading ? (
        <div className="glass-card">
          <SkeletonTable rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === 'overdue' ? AlertTriangle : CheckSquare}
          title={activeTab === 'overdue' ? 'No overdue tasks' : search ? 'No tasks found' : 'No tasks yet'}
          description={
            activeTab === 'overdue'
              ? "You're all caught up! No overdue tasks."
              : search
              ? 'Try adjusting your search or filters.'
              : 'Tasks assigned to you will appear here.'
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {['IN_PROGRESS', 'TODO', 'IN_REVIEW', 'DONE'].map((status) => {
            const group = groupedByStatus[status];
            if (group.length === 0) return null;

            return (
              <div key={status} className="glass-card overflow-hidden">
                <div className="px-5 py-3 border-b border-surface-700/50 flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="text-xs text-surface-600 font-medium">{group.length}</span>
                </div>
                {group.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} />
                ))}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
