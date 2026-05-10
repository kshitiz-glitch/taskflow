import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, CheckSquare, FolderKanban, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/utils/api';
import useAuthStore from '@/store/authStore';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate, cn } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  avatar: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-surface-700/50">
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-400" />
        </div>
        <h2 className="text-sm font-semibold text-surface-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuthStore();

  const meQuery = useQuery({
    queryKey: ['me', user?.id],
    queryFn: authApi.getMe,
  });

  useEffect(() => {
    if (meQuery.data?.data) updateUser(meQuery.data.data);
  }, [meQuery.data]);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', avatar: user?.avatar || '' },
    values: { name: user?.name || '', avatar: user?.avatar || '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      updateUser(res.data);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      passwordForm.reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const stats = meQuery.data?.data?._count;

  return (
    <div className="page-container space-y-6 max-w-3xl">
      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <Avatar user={user} size="2xl" showRing />
            {user?.role === 'ADMIN' && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center ring-2 ring-surface-800">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-surface-50">{user?.name}</h1>
            <p className="text-surface-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant={user?.role === 'ADMIN' ? 'primary' : 'default'}>
                {user?.role === 'ADMIN' ? (
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Administrator</span>
                ) : (
                  'Team Member'
                )}
              </Badge>
              {user?.createdAt && (
                <span className="flex items-center gap-1.5 text-xs text-surface-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {formatDate(user.createdAt)}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 sm:flex-col sm:items-end">
            <div className="text-center sm:text-right">
              <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                <FolderKanban className="w-4 h-4 text-brand-400" />
                <span className="text-xl font-bold text-surface-50">{stats?.ownedProjects ?? '—'}</span>
              </div>
              <p className="text-xs text-surface-500">Projects owned</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-bold text-surface-50">{stats?.assignedTasks ?? '—'}</span>
              </div>
              <p className="text-xs text-surface-500">Tasks assigned</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SectionCard title="Edit Profile" icon={User}>
          <form
            onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
            className="space-y-4"
          >
            <Input
              label="Full name"
              placeholder="Your full name"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name')}
            />
            <Input
              label="Avatar URL"
              placeholder="https://example.com/avatar.jpg"
              hint="Link to your profile picture (optional)"
              error={profileForm.formState.errors.avatar?.message}
              {...profileForm.register('avatar')}
            />
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={profileMutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
                Save changes
              </Button>
            </div>
          </form>
        </SectionCard>
      </motion.div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard title="Change Password" icon={Lock}>
          <form
            onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))}
            className="space-y-4"
          >
            <Input
              label="Current password"
              type="password"
              placeholder="Enter current password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="New password"
                type="password"
                placeholder="Min. 6 characters"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword')}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="Repeat new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={passwordMutation.isPending} leftIcon={<Lock className="w-4 h-4" />}>
                Update password
              </Button>
            </div>
          </form>
        </SectionCard>
      </motion.div>
    </div>
  );
}
