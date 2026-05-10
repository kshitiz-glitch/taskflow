import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { taskApi } from '@/utils/api';
import { TASK_STATUS, cn } from '@/utils/helpers';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { SkeletonKanbanCol } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { CheckSquare } from 'lucide-react';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const COLUMN_STYLES = {
  TODO: { header: 'text-surface-400', accent: 'border-surface-600', dot: 'bg-surface-500', bg: 'bg-surface-800/30' },
  IN_PROGRESS: { header: 'text-blue-400', accent: 'border-blue-500/30', dot: 'bg-blue-400', bg: 'bg-blue-500/5' },
  IN_REVIEW: { header: 'text-violet-400', accent: 'border-violet-500/30', dot: 'bg-violet-400', bg: 'bg-violet-500/5' },
  DONE: { header: 'text-emerald-400', accent: 'border-emerald-500/30', dot: 'bg-emerald-400', bg: 'bg-emerald-500/5' },
};

export default function KanbanBoard({ tasks = [], projectId, projectMembers = [], isLoading }) {
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskApi.updateStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['project'] });
      const prev = queryClient.getQueryData(['project', projectId]);
      queryClient.setQueryData(['project', projectId], (old) => {
        if (!old?.data?.tasks) return old;
        return {
          ...old,
          data: {
            ...old.data,
            tasks: old.data.tasks.map((t) => t.id === taskId ? { ...t, status } : t),
          },
        };
      });
      return { prev };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['project', projectId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.status === col);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (destination.droppableId !== source.droppableId) {
      statusMutation.mutate({ taskId: draggableId, status: destination.droppableId });
    }
  };

  const openNewTask = (column) => {
    setActiveColumn(column);
    setTaskFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {COLUMNS.map((col) => <SkeletonKanbanCol key={col} />)}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {COLUMNS.map((col) => {
            const style = COLUMN_STYLES[col];
            const colTasks = grouped[col] || [];

            return (
              <div
                key={col}
                className={cn(
                  'flex flex-col rounded-xl border min-w-[280px] w-[280px] flex-shrink-0',
                  style.bg, style.accent
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/40">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', style.dot)} />
                    <span className={cn('text-sm font-semibold', style.header)}>
                      {TASK_STATUS[col].label}
                    </span>
                    <span className="text-xs text-surface-600 bg-surface-700/60 rounded-full px-2 py-0.5 font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNewTask(col)}
                    className="p-1 rounded-lg hover:bg-surface-700/60 text-surface-500 hover:text-surface-300 transition-colors"
                    title="Add task"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 p-3 space-y-2.5 min-h-[200px] transition-colors duration-200',
                        snapshot.isDraggingOver && 'bg-surface-700/20'
                      )}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <CheckSquare className="w-8 h-8 text-surface-700 mb-2" />
                          <p className="text-xs text-surface-600">Drop tasks here</p>
                        </div>
                      )}
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div className={snapshot.isDragging ? 'opacity-80 rotate-1 scale-[1.02]' : ''}>
                              <TaskCard
                                task={task}
                                projectMembers={projectMembers}
                                provided={provided}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskForm
        isOpen={taskFormOpen}
        onClose={() => { setTaskFormOpen(false); setActiveColumn(null); }}
        projectId={projectId}
        projectMembers={projectMembers}
        initialStatus={activeColumn || 'TODO'}
      />
    </>
  );
}
