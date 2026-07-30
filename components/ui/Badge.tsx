'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'premium';
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide select-none font-sans border shrink-0';
  
  const variants = {
    default: 'bg-zinc-900 text-zinc-50 border-transparent dark:bg-zinc-100 dark:text-zinc-900',
    secondary: 'bg-zinc-150 text-zinc-800 border-transparent dark:bg-zinc-800/80 dark:text-zinc-200',
    outline: 'bg-transparent text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-800',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
    danger: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30',
    info: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    premium: 'bg-gradient-to-r from-brass-600/10 via-brass-500/10 to-brass-700/10 text-brass-700 dark:text-brass-300 border-brass-500/20 dark:border-brass-500/30 font-semibold',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props} />
  );
};
