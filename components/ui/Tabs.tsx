'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}: TabsProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 select-none',
        variant === 'pills' && 'bg-zinc-100 dark:bg-white/[0.03] p-1 rounded-2xl border border-zinc-200/40 dark:border-white/8',
        variant === 'underline' && 'border-b border-zinc-200/60 dark:border-zinc-800/60 w-full',
        className
      )}
      id="tabs-container"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        
        return (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brass-500 rounded-xl font-sans',
              variant === 'underline' && 'text-zinc-500 dark:text-zinc-400 pb-3 rounded-none hover:text-zinc-800 dark:hover:text-zinc-200',
              variant === 'underline' && isActive && 'text-brass-600 dark:text-brass-400 font-semibold',
              variant === 'pills' && 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200',
              variant === 'pills' && isActive && 'text-zinc-950 dark:text-zinc-50 font-semibold'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="relative z-10">{tab.label}</span>
            
            {isActive && (
              <motion.div
                layoutId={`active-tab-indicator-${variant}`}
                className={cn(
                  'absolute inset-0',
                  variant === 'underline' && 'bottom-0 top-auto h-0.5 bg-brass-600 dark:bg-brass-400',
                  variant === 'pills' && 'bg-white dark:bg-zinc-850 rounded-xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                )}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
