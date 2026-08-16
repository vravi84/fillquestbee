'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { XCircle, LogOut, Mail } from 'lucide-react';

export default function RegistrationRejectedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-rose-50/50">
          <XCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Registration Not Approved</h1>
          <p className="text-sm text-slate-600 mt-2">
            Hello, <span className="font-bold text-slate-900">{user?.name || user?.email}</span>. Your teacher registration was not approved by the administrator.
          </p>
        </div>

        <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Status</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-full shadow-xs">
              🔴 Rejected
            </span>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed pt-1">
            Access to exam creation, AI generation, and teacher dashboard functionality has been restricted for this account.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-slate-500" /> Need Help?
          </p>
          <p>
            If you believe this was a mistake or need further assistance, please contact your platform administrator.
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
