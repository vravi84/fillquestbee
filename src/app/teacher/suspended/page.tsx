'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';

export default function AccountSuspendedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto shadow-inner ring-8 ring-slate-100/50">
          <ShieldAlert className="w-10 h-10 text-slate-800" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Account Suspended</h1>
          <p className="text-sm text-slate-600 mt-2">
            Notice for <span className="font-bold text-slate-900">{user?.name || user?.email}</span>. Your teacher account has been temporarily suspended.
          </p>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Status</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-full shadow-xs">
              ⚫ Suspended
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed pt-1">
            Exam creation, question editing, AI generation, and publishing access are temporarily disabled.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-slate-500" /> Contact Administrator
          </p>
          <p>
            Please contact your system administrator to reactivate your teacher privileges.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={logout}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
