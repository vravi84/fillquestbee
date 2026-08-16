'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, LogIn, Lock, Mail } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { AppError, parseServerError } from '@/lib/errors';

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorState, setErrorState] = useState<AppError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loginAsDemoTeacher } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    if (res.success) {
      router.push('/teacher/dashboard');
    } else if (res.error) {
      setErrorState(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDemoClick = () => {
    loginAsDemoTeacher();
    router.push('/teacher/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Teacher Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your exam creation studio and student results.
          </p>
        </div>

        {/* Quick Demo button */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-xs font-semibold text-amber-800 mb-2">Want to skip login and test right away?</p>
          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all"
          >
            ⚡ Login as Demo Teacher
          </button>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Signing In...' : 'Log In'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have a teacher account yet?{' '}
          <Link href="/teacher/register" className="font-bold text-indigo-600 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
