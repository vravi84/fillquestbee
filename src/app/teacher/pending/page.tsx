'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-amber-50/50">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Account Pending Approval</h1>
          <p className="text-sm text-slate-600 mt-2">
            Welcome, <span className="font-bold text-slate-900">{user?.name || user?.email}</span>! Your teacher account has been successfully registered.
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Status</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              🟡 Pending Approval
            </span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed pt-1">
            An administrator needs to review and approve your account before you can access the teacher dashboard, create CDF exams, and use AI features.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-500 space-y-1.5">
          <p className="font-semibold text-slate-700">What happens next?</p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Administrator verifies your teacher profile.</li>
            <li>Upon approval, your dashboard will be unlocked automatically.</li>
            <li>Check back here after administrator verification.</li>
          </ul>
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
