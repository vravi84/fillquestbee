'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, Mail, KeyRound } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { AppError, parseServerError } from '@/lib/errors';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorState, setErrorState] = useState<AppError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { adminLogin, adminGoogleLogin, loginAsDemoAdmin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    setIsSubmitting(true);

    const res = await adminLogin(email, password);
    if (res.success) {
      router.push('/admin/dashboard');
    } else if (res.error) {
      if (res.error.message && res.error.message.includes('Access denied')) {
        router.push('/admin/access-denied');
      } else {
        setErrorState(res.error);
      }
    }
    setIsSubmitting(false);
  };

  const handleGoogleAdminLogin = async () => {
    setErrorState(null);
    setIsGoogleSubmitting(true);

    const res = await adminGoogleLogin();
    if (res.success) {
      router.push('/admin/dashboard');
    } else if (res.error) {
      if (res.error.message && res.error.message.includes('Access denied')) {
        router.push('/admin/access-denied');
      } else {
        setErrorState(res.error);
      }
    }
    setIsGoogleSubmitting(false);
  };

  const handleDemoAdmin = () => {
    loginAsDemoAdmin();
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl max-w-md w-full text-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Admin Portal Login</h1>
          <p className="text-xs text-slate-400 mt-1">
            Restricted authentication for platform administrators.
          </p>
        </div>

        {/* Development Demo Admin Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 text-center">
          <p className="text-xs font-semibold text-indigo-200 mb-2">Development Demo Admin Access</p>
          <button
            type="button"
            onClick={handleDemoAdmin}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Login as Demo Administrator
          </button>
        </div>

        {errorState && (
          <div className="mb-6">
            <ErrorAlert
              error={errorState}
              onDismiss={() => setErrorState(null)}
              theme="dark"
              variant="card"
            />
          </div>
        )}

        {/* Google Admin Sign-In */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isGoogleSubmitting}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{isGoogleSubmitting ? 'Verifying Admin Privileges...' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Or sign in with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-6"
          >
            {isSubmitting ? 'Authenticating Admin...' : 'Sign In to Admin Portal'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-4">
          <p className="text-[11px] text-slate-500">
            🔒 Public administrator registration is disabled for security.
          </p>
        </div>
      </div>
    </div>
  );
}
