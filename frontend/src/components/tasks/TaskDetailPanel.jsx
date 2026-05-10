import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, User, Flag, Tag, MessageCircle,
  Send, Trash2, Pencil, Clock, FolderKanban, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { taskApi } from '@/utils/api';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import TaskForm from './TaskForm';
import { formatDate, formatDateTime, formatRelative, getDueDateLabel, cn } from '@/utils/helpers';
import useAuthStore from '@/store/authStore';

function CommentItem({ comment, taskId, onDelete }) {
  const { user } = useAuthStore();
  const isOwn = comment.user?.id === user?.id || user?.role === 'ADMIN';

  return (
    <div className="flex gap-3 group">
      <Avatar user={comment.user} size="sm" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-surface-200">{comment.user?.name}</span>
          <span className="text-xs text-surface-600">{formatRelative(comment.createdAt)}</span>
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="bg-surface-700/50 rounded-xl rounded-tl-sm px-3.5 py-2.5">
          <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-surface-700/40 last:border-0">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-surface-600" />
        <span className="text-xs text-surface-500">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function TaskDetailPanel({ taskId, onClose, projectMembers = [] }) {
  const [comment, setComment] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { data, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getById(taskId),
    enabled: !!taskId,
  });

  const task = data?.data;

  const addCommentMutation = useMutation({
    mutationFn: (content) => taskApi.addComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      setComment('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => taskApi.deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Comment deleted');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmitComment(e);
    }
  };

  const due = task ? getDueDateLabel(task.dueDate) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg bg-surface-900 border-l border-surface-800 flex flex-col h-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-surface-100">Task Detail</span>
            {task && <span className="text-xs text-surface-600">#{task.id.slice(-6)}</span>}
          </div>
          <div className="flex items-center gap-2">
            {task && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditOpen(true)}
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5 space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="space-y-3 mt-6">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            </div>
          ) : task ? (
            <div className="p-5 space-y-5">
              {/* Title */}
              <div>
                <h2 className="text-xl font-bold text-surface-50 leading-snug mb-2">{task.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {due && (
                    <span className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      due.variant === 'danger' ? 'text-red-400' : due.variant === 'warning' ? 'text-amber-400' : 'text-surface-500'
                    )}>
                      {due.variant === 'danger' && <AlertTriangle className="w-3 h-3" />}
                      {due.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-700/40">
                  <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Meta */}
              <div className="bg-surface-800/30 rounded-xl border border-surface-700/40 px-4 py-1">
                <MetaRow icon={FolderKanban} label="Project">
                  <span className="text-sm text-brand-400">{task.project?.name}</span>
                </MetaRow>
                <MetaRow icon={User} label="Assignee">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar user={task.assignee} size="xs" />
                      <span className="text-sm text-surface-200">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-surface-600">Unassigned</span>
                  )}
                </MetaRow>
                <MetaRow icon={User} label="Created by">
                  <div className="flex items-center gap-2">
                    <Avatar user={task.creator} size="xs" />
                    <span className="text-sm text-surface-200">{task.creator?.name}</span>
                  </div>
                </MetaRow>
                <MetaRow icon={Calendar} label="Due date">
                  {task.dueDate ? (
                    <span className={cn(
                      'text-sm',
                      due?.variant === 'danger' ? 'text-red-400' : due?.variant === 'warning' ? 'text-amber-400' : 'text-surface-300'
                    )}>
                      {formatDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-sm text-surface-600">No due date</span>
                  )}
                </MetaRow>
                <MetaRow icon={Clock} label="Created">
                  <span className="text-sm text-surface-400">{formatDateTime(task.createdAt)}</span>
                </MetaRow>
              </div>

              {/* Comments */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-4 h-4 text-surface-500" />
                  <h3 className="text-sm font-semibold text-surface-200">
                    Comments
                    {task.comments?.length > 0 && (
                      <span className="ml-1.5 text-xs text-surface-600 font-normal">({task.comments.length})</span>
                    )}
                  </h3>
                </div>

                {task.comments?.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-surface-700/60 rounded-xl">
                    <MessageCircle className="w-7 h-7 text-surface-700 mx-auto mb-2" />
                    <p className="text-sm text-surface-600">No comments yet</p>
                    <p className="text-xs text-surface-700 mt-0.5">Be the first to comment</p>
                  </div>
                )}

                <div className="space-y-4">
                  {task.comments?.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      taskId={taskId}
                      onDelete={(id) => deleteCommentMutation.mutate(id)}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-surface-500 text-sm">
              Task not found
            </div>
          )}
        </div>

        {/* Comment input — pinned to bottom */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-surface-800 bg-surface-900">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <div className="flex gap-3">
              <Avatar user={user} size="sm" className="flex-shrink-0 mt-1" />
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment... (Ctrl+Enter to send)"
                  rows={2}
                  className="input-base resize-none text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={addCommentMutation.isPending}
                disabled={!comment.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Edit modal layered on top */}
      {task && (
        <TaskForm
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          task={task}
          projectMembers={projectMembers}
        />
      )}
    </div>
  );
}
