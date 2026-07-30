'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'empty' | 'sparkles';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon = 'empty',
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-zinc-200/80 dark:border-zinc-800/85 rounded-2xl bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm select-none',
        className
      )}
      id="empty-state"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 mb-4 border border-zinc-200/40 dark:border-zinc-700/40">
        {icon === 'sparkles' ? (
          <Sparkles className="h-6 w-6" />
        ) : (
          <div className="h-5 w-5 rounded border border-current border-dashed flex items-center justify-center text-xs">/</div>
        )}
      </div>
      <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction} id="empty-state-action-btn">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
