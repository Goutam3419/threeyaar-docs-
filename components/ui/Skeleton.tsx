'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton = ({ className, variant = 'rect', ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse-slow bg-zinc-200/60 dark:bg-zinc-800/60',
        variant === 'text' && 'h-4 w-full rounded-md',
        variant === 'rect' && 'rounded-2xl',
        variant === 'circle' && 'rounded-full',
        className
      )}
      {...props}
    />
  );
};
