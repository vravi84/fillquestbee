'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ChevronDown, ShieldAlert } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { parseServerError } from '@/lib/errors';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  const parsedError = parseServerError(error);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl max-w-lg w-full text-slate-900">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Something Went Wrong
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            An unexpected server or application error occurred while processing your request.
          </p>
        </div>

        <div className="mb-6">
          <ErrorAlert error={parsedError} variant="card" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-1/2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-1/2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 text-center"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        {error.digest && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] font-mono text-slate-400">
              Error Ref: {error.digest}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
