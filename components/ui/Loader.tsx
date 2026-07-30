'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'pulse' | 'dots';
  className?: string;
}

export const Loader = ({ size = 'md', variant = 'spinner', className }: LoaderProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const borderSizes = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4',
  };

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center gap-1 shrink-0', className)} id="loader-pulse">
        <div className={cn('bg-brass-500 rounded-full animate-bounce', size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2')} style={{ animationDelay: '0ms' }} />
        <div className={cn('bg-brass-500 rounded-full animate-bounce', size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2')} style={{ animationDelay: '150ms' }} />
        <div className={cn('bg-brass-500 rounded-full animate-bounce', size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2')} style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1.5', className)} id="loader-dots">
        <div className="h-2 w-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse-slow" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse-slow" style={{ animationDelay: '200ms' }} />
        <div className="h-2 w-2 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse-slow" style={{ animationDelay: '400ms' }} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full border-zinc-200 dark:border-zinc-800 border-t-brass-600 dark:border-t-brass-400 animate-spin shrink-0',
        sizes[size],
        borderSizes[size],
        className
      )}
      id="loader-spinner"
    />
  );
};
