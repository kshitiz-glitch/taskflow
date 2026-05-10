import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2, Calendar, CheckSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { projectApi } from '@/utils/api';
import { StatusBadge } from '@/components/ui/Badge';
import { AvatarGroup } from '@/components/ui/Avatar';
import ProjectForm from './ProjectForm';
import { formatDate, getDueDateLabel, cn, truncate } from '@/utils/helpers';

export default function ProjectCard({ project }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => projectApi.delete(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Project deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  const deadline = getDueDateLabel(project.deadline);
  const taskCount = project._count?.tasks || 0;
  const memberCount = project._count?.members || 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="group card hover:shadow-card-hover hover:border-surface-600/60 hover:-translate-y-0.5 transition-all duration-200 relative"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <StatusBadge status={project.status} type="project" />
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-600 hover:text-surface-300 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Title & description */}
        <Link to={`/projects/${project.id}`} className="block mb-3">
          <h3 className="text-base font-semibold text-surface-100 group-hover:text-white transition-colors mb-1.5 leading-snug">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-surface-500 leading-relaxed">
              {truncate(project.description, 90)}
            </p>
          )}
        </Link>

        {/* Stats row */}
        <div className="flex items-center gap-4 py-3 border-y border-surface-700/50 my-3">
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <CheckSquare className="w-3.5 h-3.5 text-surface-600" />
            <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <Users className="w-3.5 h-3.5 text-surface-600" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
          {project.deadline && deadline && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs ml-auto',
              deadline.variant === 'danger' ? 'text-red-400' :
              deadline.variant === 'warning' ? 'text-amber-400' : 'text-surface-500'
            )}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{deadline.variant === 'default' ? formatDate(project.deadline) : deadline.label}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <AvatarGroup users={project.members?.map((m) => m.user) || []} max={4} />
          <Link
            to={`/projects/${project.id}`}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Open →
          </Link>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-3 top-12 z-20 w-44 glass-card shadow-card-hover py-1"
              >
                <button
                  onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-700/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit project
                </button>
                <button
                  onClick={() => { setMenuOpen(false); deleteMutation.mutate(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete project
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      <ProjectForm
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
      />
    </>
  );
}
