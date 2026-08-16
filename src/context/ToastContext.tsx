'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppError, parseServerError } from '@/lib/errors';
import { ToastContainer, ToastItem } from '@/components/ui/Toast';

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: Partial<ToastItem>) => string;
  showErrorToast: (error: AppError | Error | string, title?: string) => string;
  showSuccessToast: (message: string, title?: string) => string;
  showWarningToast: (message: string, title?: string) => string;
  showInfoToast: (message: string, title?: string) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: Partial<ToastItem>) => {
      const id = options.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastItem = {
        id,
        title: options.title || 'Notification',
        message: options.message || '',
        variant: options.variant || 'info',
        duration: options.duration ?? 5000,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Limit to max 5 visible toasts

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [dismissToast]
  );

  const showErrorToast = useCallback(
    (error: AppError | Error | string, overrideTitle?: string) => {
      const parsed = parseServerError(error);
      return showToast({
        title: overrideTitle || parsed.title || 'Error',
        message: parsed.message,
        variant: 'error',
        duration: 6000,
      });
    },
    [showToast]
  );

  const showSuccessToast = useCallback(
    (message: string, title = 'Success') => {
      return showToast({
        title,
        message,
        variant: 'success',
        duration: 4000,
      });
    },
    [showToast]
  );

  const showWarningToast = useCallback(
    (message: string, title = 'Warning') => {
      return showToast({
        title,
        message,
        variant: 'warning',
        duration: 5000,
      });
    },
    [showToast]
  );

  const showInfoToast = useCallback(
    (message: string, title = 'Information') => {
      return showToast({
        title,
        message,
        variant: 'info',
        duration: 4000,
      });
    },
    [showToast]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showErrorToast,
        showSuccessToast,
        showWarningToast,
        showInfoToast,
        dismissToast,
        clearAllToasts,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
