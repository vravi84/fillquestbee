'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  ShieldAlert,
  Info,
  RotateCw,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AppError, parseServerError } from '@/lib/errors';
import { cn } from '@/lib/utils';

export interface ErrorAlertProps {
  error?: AppError | Error | string | null;
  title?: string;
  message?: string;
  actionHint?: string;
  actionLabel?: string;
  actionUrl?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'card' | 'inline' | 'minimal';
  theme?: 'light' | 'dark';
  className?: string;
}

export function ErrorAlert({
  error,
  title: overrideTitle,
  message: overrideMessage,
  actionHint: overrideActionHint,
  actionLabel: overrideActionLabel,
  actionUrl: overrideActionUrl,
  onRetry,
  onDismiss,
  variant = 'card',
  theme = 'light',
  className,
}: ErrorAlertProps) {
  if (!error && !overrideMessage) return null;

  const parsed: AppError = error
    ? typeof error === 'object' && 'title' in error && 'message' in error
      ? (error as AppError)
      : parseServerError(error)
    : {
        title: overrideTitle || 'Notice',
        message: overrideMessage || '',
        actionHint: overrideActionHint,
        actionLabel: overrideActionLabel,
        actionUrl: overrideActionUrl,
      };

  const title = overrideTitle || parsed.title;
  const message = overrideMessage || parsed.message;
  const actionHint = overrideActionHint || parsed.actionHint;
  const actionLabel = overrideActionLabel || parsed.actionLabel;
  const actionUrl = overrideActionUrl || parsed.actionUrl;
  const errorVariant = parsed.variant || 'error';

  // Icon mapping
  const renderIcon = () => {
    const iconClass = cn(
      'shrink-0',
      variant === 'minimal' ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'
    );
    if (parsed.code?.includes('admin') || parsed.code?.includes('permission')) {
      return <ShieldAlert className={iconClass} />;
    }
    if (errorVariant === 'warning') {
      return <AlertTriangle className={iconClass} />;
    }
    if (errorVariant === 'info') {
      return <Info className={iconClass} />;
    }
    return <AlertCircle className={iconClass} />;
  };

  // Color schemas
  const isDark = theme === 'dark';

  const colorStyles = {
    error: isDark
      ? {
          bg: 'bg-rose-950/70 border-rose-800/80 text-rose-200',
          iconBg: 'bg-rose-900/50 text-rose-400 border-rose-700/50',
          accentBtn: 'bg-rose-600 hover:bg-rose-500 text-white',
          textMuted: 'text-rose-300/80',
          hintBg: 'bg-rose-900/30 border-rose-800/50 text-rose-300',
        }
      : {
          bg: 'bg-rose-50/90 border-rose-200/90 text-rose-900',
          iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
          accentBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
          textMuted: 'text-rose-700',
          hintBg: 'bg-rose-100/70 border-rose-200/70 text-rose-800',
        },
    warning: isDark
      ? {
          bg: 'bg-amber-950/70 border-amber-800/80 text-amber-200',
          iconBg: 'bg-amber-900/50 text-amber-400 border-amber-700/50',
          accentBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
          textMuted: 'text-amber-300/80',
          hintBg: 'bg-amber-900/30 border-amber-800/50 text-amber-300',
        }
      : {
          bg: 'bg-amber-50/90 border-amber-200/90 text-amber-900',
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
          accentBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
          textMuted: 'text-amber-800',
          hintBg: 'bg-amber-100/70 border-amber-200/70 text-amber-900',
        },
    info: isDark
      ? {
          bg: 'bg-sky-950/70 border-sky-800/80 text-sky-200',
          iconBg: 'bg-sky-900/50 text-sky-400 border-sky-700/50',
          accentBtn: 'bg-sky-600 hover:bg-sky-500 text-white',
          textMuted: 'text-sky-300/80',
          hintBg: 'bg-sky-900/30 border-sky-800/50 text-sky-300',
        }
      : {
          bg: 'bg-sky-50/90 border-sky-200/90 text-sky-900',
          iconBg: 'bg-sky-100 text-sky-600 border-sky-200',
          accentBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
          textMuted: 'text-sky-700',
          hintBg: 'bg-sky-100/70 border-sky-200/70 text-sky-800',
        },
  }[errorVariant];

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-1 duration-200',
          colorStyles.bg,
          className
        )}
      >
        {renderIcon()}
        <span className="flex-1 truncate">{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 hover:opacity-80 transition-opacity rounded-md"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-start gap-2.5 p-3 rounded-xl border text-xs font-medium animate-in fade-in duration-200',
          colorStyles.bg,
          className
        )}
      >
        <div className="mt-0.5">{renderIcon()}</div>
        <div className="flex-1 space-y-1">
          {title && <h5 className="font-bold leading-snug">{title}</h5>}
          <p className={colorStyles.textMuted}>{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 hover:opacity-75 transition-opacity rounded-md"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300',
        colorStyles.bg,
        className
      )}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div
          className={cn(
            'p-2.5 sm:p-3 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm',
            colorStyles.iconBg
          )}
        >
          {renderIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-extrabold text-sm sm:text-base leading-snug tracking-tight">
              {title}
            </h4>
            {parsed.code && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold border',
                  isDark ? 'bg-slate-900/60 border-slate-700/60 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-500'
                )}
              >
                {parsed.code}
              </span>
            )}
          </div>

          <p className={cn('text-xs sm:text-sm font-medium leading-relaxed mb-3', colorStyles.textMuted)}>
            {message}
          </p>

          {/* Action Hint Box */}
          {actionHint && (
            <div
              className={cn(
                'p-2.5 sm:p-3 rounded-xl border text-xs font-semibold mb-3 flex items-start gap-2',
                colorStyles.hintBg
              )}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
              <span>{actionHint}</span>
            </div>
          )}

          {/* Action Buttons */}
          {(onRetry || actionUrl || actionLabel) && (
            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95',
                    colorStyles.accentBtn
                  )}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}

              {actionUrl && actionLabel && (
                <Link
                  href={actionUrl}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border',
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
                  )}
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'p-1.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/10 shrink-0 opacity-70 hover:opacity-100',
              colorStyles.textMuted
            )}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
