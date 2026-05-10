import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/utils/api';
import useAuthStore from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@taskflow.com', password: 'admin123', color: 'text-brand-400' },
  { label: 'Alice', email: 'alice@taskflow.com', password: 'member123', color: 'text-emerald-400' },
  { label: 'Bob', email: 'bob@taskflow.com', password: 'member123', color: 'text-violet-400' },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      queryClient.clear();
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.message),
  });

  const fillDemo = (account) => {
    setValue('email', account.email);
    setValue('password', account.password);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left: Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-900 via-brand-950/40 to-surface-900 p-12 border-r border-surface-800"
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
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-surface-50 leading-tight mb-4">
              Manage projects.<br />
              <span className="gradient-text">Ship faster.</span>
            </h2>
            <p className="text-surface-400 text-lg leading-relaxed max-w-sm">
              Collaborate with your team, track progress, and deliver results — all in one beautifully designed workspace.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 grid grid-cols-3 gap-4"
          >
            {[
              { value: '10k+', label: 'Projects' },
              { value: '50k+', label: 'Tasks completed' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-brand-400">{stat.value}</div>
                <div className="text-xs text-surface-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-surface-600 text-sm">© 2025 TaskFlow. Built for teams that ship.</p>
      </motion.div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-50">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-surface-50 mb-2">Welcome back</h1>
            <p className="text-surface-400">Sign in to continue to your workspace</p>
          </div>

          {/* Demo accounts */}
          <div className="mb-6 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
            <p className="text-xs text-surface-500 mb-2.5 font-medium">Quick demo access:</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className={`text-xs px-3 py-1.5 rounded-lg bg-surface-700/60 hover:bg-surface-700 transition-colors font-medium ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
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
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="pointer-events-auto hover:text-surface-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={loginMutation.isPending}
              className="w-full text-base py-3"
            >
              <span className="flex items-center justify-center gap-2">
                Sign in
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
