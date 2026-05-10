import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2, MessageCircle, Calendar, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { taskApi } from '@/utils/api';
import { PriorityBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import TaskForm from './TaskForm';
import TaskDetailPanel from './TaskDetailPanel';
import { getDueDateLabel, cn } from '@/utils/helpers';

export default function TaskCard({ task, projectMembers = [], provided }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => taskApi.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Task deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  const due = getDueDateLabel(task.dueDate);

  return (
    <>
      <div
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        onClick={() => setDetailOpen(true)}
        className={cn(
          'group relative bg-surface-800 rounded-xl p-4 border border-surface-700/60',
          'hover:border-brand-500/40 hover:shadow-card-hover transition-all duration-200',
          'cursor-pointer select-none'
        )}
      >
        {/* Drag handle */}
        {provided && (
          <div
            {...provided.dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-surface-600 hover:text-surface-400 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Priority + menu */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <PriorityBadge priority={task.priority} />
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-md hover:bg-surface-700 text-surface-500 hover:text-surface-300 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-surface-100 leading-snug mb-2 pr-6 group-hover:text-white transition-colors">
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-surface-500 leading-relaxed mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-700/50">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <Avatar user={task.assignee} size="xs" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-surface-600 flex items-center justify-center">
                <span className="text-[10px] text-surface-600">?</span>
              </div>
            )}
            {task._count?.comments > 0 && (
              <span className="flex items-center gap-1 text-xs text-surface-500">
                <MessageCircle className="w-3 h-3" />
                {task._count.comments}
              </span>
            )}
          </div>

          {task.dueDate && due && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              due.variant === 'danger' ? 'text-red-400' : due.variant === 'warning' ? 'text-amber-400' : 'text-surface-500'
            )}>
              <Calendar className="w-3 h-3" />
              <span>{due.label}</span>
            </div>
          )}
        </div>

        {/* Dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-2 top-10 z-20 w-44 glass-card shadow-card-hover py-1"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDetailOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-700/50 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  View & comment
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-700/50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit task
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); deleteMutation.mutate(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete task
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {detailOpen && (
          <TaskDetailPanel
            taskId={task.id}
            onClose={() => setDetailOpen(false)}
            projectMembers={projectMembers}
          />
        )}
      </AnimatePresence>

      <TaskForm
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        task={task}
        projectMembers={projectMembers}
      />
    </>
  );
}
