'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, UserPlus, Mail, Lock, User } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { AppError, parseServerError } from '@/lib/errors';

export default function TeacherRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorState, setErrorState] = useState<AppError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);

    if (password.length < 6) {
      setErrorState({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.',
        actionHint: 'Choose a stronger password with at least 6 characters.',
        variant: 'warning',
      });
      return;
    }
    setIsSubmitting(true);

    const res = await register(name, email, password);
    if (res.success) {
      router.push('/teacher/pending');
    } else if (res.error) {
      setErrorState(res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Teacher Registration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create a teacher account to generate interactive CDF exams.
          </p>
        </div>

        {errorState && (
          <div className="mb-6">
            <ErrorAlert
              error={errorState}
              onDismiss={() => setErrorState(null)}
              variant="card"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prof. Sarah Jenkins"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.jenkins@school.edu"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/teacher/login" className="font-bold text-indigo-600 hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
