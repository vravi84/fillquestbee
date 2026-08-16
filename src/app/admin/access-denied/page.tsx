'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function AccessDeniedPage() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">403 — Access Denied</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your account <span className="font-bold text-slate-200">{user?.email || 'authenticated user'}</span> does not possess administrator privileges or the <code className="text-rose-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">admin: true</code> custom claim.
          </p>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
          <p className="font-bold text-slate-300">Why am I seeing this page?</p>
          <ul className="text-slate-400 space-y-1 list-disc list-inside">
            <li>The Admin Portal is restricted exclusively to system administrators.</li>
            <li>Teacher and student accounts cannot access administrative routes.</li>
            <li>If you are an administrator, contact the project owner to assign your admin privileges.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => logout()}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out & Switch Account
          </button>

          <Link
            href="/teacher/dashboard"
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Teacher Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
