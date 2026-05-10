import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskApi, userApi } from '@/utils/api';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Input, { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export default function TaskForm({ isOpen, onClose, task, projectId, projectMembers = [], initialStatus }) {
  const queryClient = useQueryClient();
  const isEditing = !!(task?.id);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || initialStatus || 'TODO',
      priority: task?.priority || 'MEDIUM',
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
      assigneeId: task?.assignee?.id || '',
    },
  });

  const mutation = useMutation({
    mutationFn: isEditing
      ? (data) => taskApi.update(task.id, data)
      : (data) => taskApi.create({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(isEditing ? 'Task updated!' : 'Task created!');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      dueDate: data.dueDate || null,
      assigneeId: data.assigneeId || null,
    };
    mutation.mutate(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Create Task'} size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-4">
          <Input
            label="Task title *"
            placeholder="What needs to be done?"
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            label="Description"
            placeholder="Add more details about this task..."
            rows={3}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" {...register('status')}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </Select>

            <Select label="Priority" {...register('priority')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due date"
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />

            <Select label="Assignee" {...register('assigneeId')}>
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.user?.id || m.id} value={m.user?.id || m.id}>
                  {m.user?.name || m.name}
                </option>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Save changes' : 'Create task'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
