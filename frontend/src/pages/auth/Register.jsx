import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/utils/api';
import useAuthStore from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const features = [
  'Role-based access control',
  'Kanban board & task tracking',
  'Team collaboration tools',
  'Real-time dashboard analytics',
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      queryClient.clear();
      setAuth(res.data.user, res.data.token);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-900 via-violet-950/30 to-surface-900 p-12 border-r border-surface-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-surface-50">TaskFlow</span>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-surface-50 leading-tight mb-4">
              Start building<br />
              <span className="gradient-text">your workflow.</span>
            </h2>
            <p className="text-surface-400 text-lg max-w-sm">
              Join thousands of teams using TaskFlow to organize work and ship projects on time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-10 space-y-3"
          >
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <span className="text-surface-300 text-sm">{f}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-surface-600 text-sm">© 2025 TaskFlow. Free to get started.</p>
      </motion.div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-50">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-50 mb-2">Create your account</h1>
            <p className="text-surface-400">Get started for free. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Alex Johnson"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="pointer-events-auto hover:text-surface-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              loading={registerMutation.isPending}
              className="w-full text-base py-3 mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                Create account
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in instead
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
