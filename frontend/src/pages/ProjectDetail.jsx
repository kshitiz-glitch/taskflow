import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Users, Settings, Pencil, Trash2,
  Calendar, CheckSquare, UserPlus, X, Crown, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectApi, userApi } from '@/utils/api';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import ProjectForm from '@/components/projects/ProjectForm';
import TaskForm from '@/components/tasks/TaskForm';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, getDueDateLabel, cn } from '@/utils/helpers';
import useAuthStore from '@/store/authStore';

function MemberBadge({ role }) {
  if (role === 'ADMIN') return (
    <span className="flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
      <Crown className="w-3 h-3" />Admin
    </span>
  );
  return (
    <span className="text-xs text-surface-500 bg-surface-700/60 px-2 py-0.5 rounded-full">Member</span>
  );
}

function AddMemberModal({ isOpen, onClose, projectId }) {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  const searchQuery = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => userApi.search(query),
    enabled: query.length > 1,
  });

  const addMutation = useMutation({
    mutationFn: (userId) => projectApi.addMember(projectId, { userId, role: 'MEMBER' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Member added!');
      onClose();
      setQuery('');
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="sm">
      <ModalBody className="space-y-4">
        <Input
          label="Search by name or email"
          placeholder="Type to search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.length > 1 && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {searchQuery.isLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            )}
            {searchQuery.data?.data?.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  selectedUser?.id === user.id ? 'bg-brand-500/15 border border-brand-500/30' : 'hover:bg-surface-700/50'
                )}
              >
                <Avatar user={user} size="sm" />
                <div>
                  <p className="text-sm font-medium text-surface-200">{user.name}</p>
                  <p className="text-xs text-surface-500">{user.email}</p>
                </div>
              </button>
            ))}
            {searchQuery.data?.data?.length === 0 && (
              <p className="text-sm text-surface-500 text-center py-4">No users found</p>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedUser}
          loading={addMutation.isPending}
          onClick={() => selectedUser && addMutation.mutate(selectedUser.id)}
        >
          Add member
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id),
  });

  const project = data?.data;

  const deleteMutation = useMutation({
    mutationFn: () => projectApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
      navigate('/projects');
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectApi.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(err.message),
  });

  const isOwner = project?.owner?.id === currentUser?.id || currentUser?.role === 'ADMIN';
  const myMembership = project?.members?.find((m) => m.user?.id === currentUser?.id);
  const isProjectAdmin = isOwner || myMembership?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 w-[280px] flex-shrink-0" />)}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-container">
        <div className="text-center py-20">
          <p className="text-surface-500">Project not found</p>
          <Link to="/projects" className="text-brand-400 hover:text-brand-300 text-sm mt-2 inline-block">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const deadline = getDueDateLabel(project.deadline);

  return (
    <div className="page-container space-y-5">
      {/* Back + header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-50">{project.name}</h1>
              <StatusBadge status={project.status} type="project" />
            </div>
            {project.description && (
              <p className="text-sm text-surface-500 mt-1.5 max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {project.deadline && (
                <div className={cn(
                  'flex items-center gap-1.5 text-xs',
                  deadline?.variant === 'danger' ? 'text-red-400' : deadline?.variant === 'warning' ? 'text-amber-400' : 'text-surface-500'
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  Deadline: {formatDate(project.deadline)}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-surface-500">
                <CheckSquare className="w-3.5 h-3.5" />
                {project._count?.tasks || 0} tasks
              </div>
              <div className="flex items-center gap-1.5 text-xs text-surface-500">
                <Users className="w-3.5 h-3.5" />
                {project._count?.members || 0} members
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setTaskFormOpen(true)}
            >
              Add task
            </Button>
            {isProjectAdmin && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-800">
        {[
          { id: 'board', label: 'Kanban Board', icon: CheckSquare },
          { id: 'members', label: `Team (${project.members?.length || 0})`, icon: Users },
        ].map((tab) => (
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
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Board tab */}
      {activeTab === 'board' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <KanbanBoard
            tasks={project.tasks || []}
            projectId={id}
            projectMembers={project.members || []}
          />
        </motion.div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">{project.members?.length} team member{project.members?.length !== 1 ? 's' : ''}</p>
            {isProjectAdmin && (
              <Button
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setAddMemberOpen(true)}
              >
                Add member
              </Button>
            )}
          </div>

          <div className="glass-card overflow-hidden">
            {project.members?.map((member, i) => (
              <div
                key={member.userId || member.user?.id}
                className={cn(
                  'flex items-center justify-between px-5 py-3.5 hover:bg-surface-700/30 transition-colors',
                  i !== 0 && 'border-t border-surface-700/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={member.user} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-surface-200">{member.user?.name}</p>
                      {project.owner?.id === member.user?.id && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Crown className="w-3 h-3" />Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MemberBadge role={member.role} />
                  {isProjectAdmin && project.owner?.id !== member.user?.id && member.user?.id !== currentUser?.id && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.user?.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-surface-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <ProjectForm isOpen={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <TaskForm
        isOpen={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        projectId={id}
        projectMembers={project.members || []}
      />
      <AddMemberModal isOpen={addMemberOpen} onClose={() => setAddMemberOpen(false)} projectId={id} />
    </div>
  );
}
