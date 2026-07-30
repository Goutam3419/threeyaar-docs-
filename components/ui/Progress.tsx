'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  color?: 'brass' | 'emerald' | 'blue' | 'zinc';
  showValueLabel?: boolean;
}

export const Progress = ({
  value,
  className,
  color = 'brass',
  showValueLabel = false,
}: ProgressProps) => {
  const percent = Math.min(Math.max(0, value), 100);

  const colors = {
    brass: 'bg-brass-600 dark:bg-brass-500',
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    blue: 'bg-blue-600 dark:bg-blue-500',
    zinc: 'bg-zinc-800 dark:bg-zinc-200',
  };

  return (
    <div className="w-full flex flex-col gap-1.5 select-none" id="progress-container">
      {showValueLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span>Progress</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div
        className={cn(
          'h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/20 dark:border-zinc-800/20',
          className
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colors[color])}
          id="progress-fill-bar"
        />
      </div>
    </div>
  );
};
