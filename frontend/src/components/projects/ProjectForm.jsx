import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectApi } from '@/utils/api';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Input, { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  status: z.string(),
  deadline: z.string().optional(),
});

export default function ProjectForm({ isOpen, onClose, project }) {
  const queryClient = useQueryClient();
  const isEditing = !!project;

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'ACTIVE',
      deadline: project?.deadline ? project.deadline.slice(0, 10) : '',
    },
  });

  const mutation = useMutation({
    mutationFn: isEditing
      ? (data) => projectApi.update(project.id, data)
      : projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(isEditing ? 'Project updated!' : 'Project created!');
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Project' : 'New Project'} size="md">
      <form onSubmit={handleSubmit((data) => mutation.mutate({ ...data, deadline: data.deadline || null }))}>
        <ModalBody className="space-y-4">
          <Input
            label="Project name *"
            placeholder="E.g., Website Redesign"
            error={errors.name?.message}
            {...register('name')}
          />

          <Textarea
            label="Description"
            placeholder="What's this project about?"
            rows={3}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </Select>

            <Input
              label="Deadline"
              type="date"
              {...register('deadline')}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Save changes' : 'Create project'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
