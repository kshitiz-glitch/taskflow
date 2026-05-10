import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderKanban, CheckCircle2, AlertTriangle, TrendingUp,
  Clock, ListTodo, ArrowRight, BarChart3, Activity
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardApi } from '@/utils/api';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { SkeletonStatCard, SkeletonTable } from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import { formatDate, formatRelative, getDueDateLabel, cn, TASK_STATUS } from '@/utils/helpers';
import useAuthStore from '@/store/authStore';

const PIE_COLORS = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#8b5cf6',
  DONE: '#10b981',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

function StatCard({ icon: Icon, label, value, subtitle, color, trend }) {
  return (
    <div className="card group hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-surface-50 mt-1.5 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-surface-700/50">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{trend}% completion rate</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }) {
  const due = getDueDateLabel(task.dueDate);
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-700/30 rounded-lg transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-200 truncate group-hover:text-surface-50">{task.title}</p>
        <p className="text-xs text-surface-500 truncate mt-0.5">{task.project?.name}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={task.status} />
        {due && (
          <span className={cn(
            'text-xs font-medium hidden sm:block',
            due.variant === 'danger' ? 'text-red-400' : due.variant === 'warning' ? 'text-amber-400' : 'text-surface-500'
          )}>
            {due.label}
          </span>
        )}
        {task.assignee && <Avatar user={task.assignee} size="xs" />}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs text-surface-200 shadow-card">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const stats = data?.data;

  const pieData = stats ? Object.entries(stats.tasksByStatus).map(([key, value]) => ({
    name: TASK_STATUS[key]?.label || key,
    value,
    key,
  })).filter(d => d.value > 0) : [];

  const barData = stats ? [
    { name: 'To Do', count: stats.tasksByStatus.TODO, fill: PIE_COLORS.TODO },
    { name: 'In Progress', count: stats.tasksByStatus.IN_PROGRESS, fill: PIE_COLORS.IN_PROGRESS },
    { name: 'In Review', count: stats.tasksByStatus.IN_REVIEW, fill: PIE_COLORS.IN_REVIEW },
    { name: 'Done', count: stats.tasksByStatus.DONE, fill: PIE_COLORS.DONE },
  ] : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container space-y-6">
      {/* Greeting */}
      <motion.div {...fadeUp(0)}>
        <h2 className="text-xl font-semibold text-surface-100">
          {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-sm text-surface-500 mt-0.5">Here's what's happening with your projects today.</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={FolderKanban}
              label="Active Projects"
              value={stats?.overview.activeProjects ?? 0}
              subtitle={`${stats?.overview.totalProjects ?? 0} total`}
              color="bg-gradient-to-br from-brand-600 to-brand-500"
            />
            <StatCard
              icon={ListTodo}
              label="Total Tasks"
              value={stats?.overview.totalTasks ?? 0}
              subtitle={`${stats?.overview.myTasks ?? 0} assigned to me`}
              color="bg-gradient-to-br from-blue-600 to-blue-500"
              trend={stats?.overview.completionRate}
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={stats?.overview.completedTasks ?? 0}
              subtitle={`${stats?.overview.completionRate ?? 0}% rate`}
              color="bg-gradient-to-br from-emerald-600 to-emerald-500"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={stats?.overview.overdueTasks ?? 0}
              subtitle="Needs attention"
              color={stats?.overview.overdueTasks > 0 ? "bg-gradient-to-br from-red-600 to-red-500" : "bg-gradient-to-br from-surface-700 to-surface-600"}
            />
          </>
        )}
      </motion.div>

      {/* Charts + Recent Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Charts */}
        <motion.div {...fadeUp(0.1)} className="xl:col-span-2 space-y-4">
          {/* Pie chart */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4.5 h-4.5 text-surface-400" />
              <h3 className="text-sm font-semibold text-surface-100">Task Breakdown</h3>
            </div>
            {isLoading ? (
              <div className="h-40 shimmer-base rounded-lg" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-surface-400">{value}</span>}
                    iconSize={8}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-surface-500">No tasks yet</div>
            )}
          </div>

          {/* Bar chart */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4.5 h-4.5 text-surface-400" />
              <h3 className="text-sm font-semibold text-surface-100">Status Distribution</h3>
            </div>
            {isLoading ? (
              <div className="h-32 shimmer-base rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Recent tasks */}
        <motion.div {...fadeUp(0.15)} className="xl:col-span-3">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-surface-400" />
                <h3 className="text-sm font-semibold text-surface-100">Recent Tasks</h3>
              </div>
              <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {isLoading ? (
              <SkeletonTable rows={6} />
            ) : stats?.recentTasks?.length > 0 ? (
              <div className="space-y-0.5">
                {stats.recentTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-surface-700 mb-3" />
                <p className="text-sm text-surface-500">No tasks yet</p>
                <Link to="/projects" className="mt-2 text-xs text-brand-400 hover:text-brand-300">
                  Create a project to get started
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Upcoming deadlines */}
      {stats?.upcomingDeadlines?.length > 0 && (
        <motion.div {...fadeUp(0.2)}>
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
              <h3 className="text-sm font-semibold text-surface-100">Upcoming Project Deadlines</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {stats.upcomingDeadlines.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-700/30 hover:bg-surface-700/50 border border-surface-700/50 hover:border-surface-600/60 transition-all duration-200"
                >
                  <p className="text-sm font-medium text-surface-200 truncate">{project.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-400">{formatDate(project.deadline)}</span>
                    <span className="text-xs text-surface-500">{project._count.tasks} tasks</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
