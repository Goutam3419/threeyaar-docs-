'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
  size = 'md',
  className,
}: DrawerProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sideAnimations = {
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      classes: 'right-0 top-0 bottom-0 h-full border-l rounded-l-2xl',
    },
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
      classes: 'left-0 top-0 bottom-0 h-full border-r rounded-r-2xl',
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
      classes: 'top-0 left-0 right-0 w-full border-b rounded-b-2xl',
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      classes: 'bottom-0 left-0 right-0 w-full border-t rounded-t-2xl',
    },
  };

  const sizes = {
    sm: side === 'top' || side === 'bottom' ? 'h-[30vh]' : 'max-w-xs sm:max-w-sm',
    md: side === 'top' || side === 'bottom' ? 'h-[50vh]' : 'max-w-md sm:max-w-lg',
    lg: side === 'top' || side === 'bottom' ? 'h-[75vh]' : 'max-w-xl sm:max-w-2xl',
    full: side === 'top' || side === 'bottom' ? 'h-full' : 'max-w-full',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex" id="drawer-portal">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm"
            id="drawer-backdrop"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={sideAnimations[side].initial}
            animate={sideAnimations[side].animate}
            exit={sideAnimations[side].exit}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={cn(
              'fixed bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden w-full h-full',
              sideAnimations[side].classes,
              sizes[size],
              className
            )}
            id="drawer-content"
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex flex-col gap-1">
                  {title && (
                    <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50" id="drawer-title">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans" id="drawer-description">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  id="drawer-close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 text-sm text-zinc-700 dark:text-zinc-300 font-sans">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
