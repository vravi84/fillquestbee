'use client';

import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { parseServerError } from '@/lib/errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const parsed = parseServerError(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">{parsed.title || 'Critical System Error'}</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {parsed.message || 'A critical error prevented the application from rendering.'}
          </p>

          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>

          {error.digest && (
            <p className="mt-6 text-[10px] font-mono text-slate-500">
              System Digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
