'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, options?: { description?: string; type?: ToastType; duration?: number }) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, options?: { description?: string; type?: ToastType; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const type = options?.type || 'info';
    const duration = options?.duration || 4000;
    const description = options?.description;

    const newToast: Toast = { id, message, description, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full sm:w-96 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let iconColor = 'text-blue-500';
            let bgColor = 'bg-white dark:bg-zinc-900';
            let borderColor = 'border-zinc-200 dark:border-zinc-800';

            switch (t.type) {
              case 'success':
                Icon = CheckCircle;
                iconColor = 'text-emerald-500';
                break;
              case 'error':
                Icon = AlertCircle;
                iconColor = 'text-rose-500';
                break;
              case 'warning':
                Icon = AlertTriangle;
                iconColor = 'text-amber-500';
                break;
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${bgColor} ${borderColor}`}
                id={`toast-${t.id}`}
              >
                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 font-sans">
                    {t.message}
                  </h3>
                  {t.description && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  id={`toast-close-${t.id}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
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
