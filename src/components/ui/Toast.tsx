'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastSingle key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastSingle({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const variant = toast.variant || 'info';

  const styles = {
    error: {
      border: 'border-rose-300 dark:border-rose-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
      iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
      progress: 'bg-rose-500',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    success: {
      border: 'border-emerald-300 dark:border-emerald-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
      progress: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    warning: {
      border: 'border-amber-300 dark:border-amber-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
      iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-500',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      border: 'border-indigo-300 dark:border-indigo-800/80',
      bg: 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100',
      iconBg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
      progress: 'bg-indigo-500',
      icon: <Info className="w-5 h-5" />,
    },
  }[variant];

  return (
    <div
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-right-4 duration-300',
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
            styles.iconBg
          )}
        >
          {styles.icon}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <h5 className="font-extrabold text-xs sm:text-sm leading-snug tracking-tight mb-0.5">
              {toast.title}
            </h5>
          )}
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            {toast.message}
          </p>

          {toast.onAction && toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onDismiss();
              }}
              className="mt-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-lg shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
