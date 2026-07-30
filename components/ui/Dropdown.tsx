'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

export const Dropdown = ({ children, className }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownTrigger must be used within a Dropdown');
  const { isOpen, setIsOpen } = context;

  const triggerClick = () => setIsOpen(!isOpen);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        triggerClick();
        if (child.props.onClick) child.props.onClick(e);
      },
      id: 'dropdown-trigger-btn',
    });
  }

  return (
    <button
      onClick={triggerClick}
      className="inline-flex justify-center w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 focus:outline-none"
      id="dropdown-trigger-btn"
    >
      {children}
    </button>
  );
};

export const DropdownMenu = ({ children, align = 'right', className }: { children: React.ReactNode; align?: 'left' | 'right'; className?: string }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenu must be used within a Dropdown');
  const { isOpen } = context;

  const alignments = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#14161C]/90 p-1.5 shadow-premium-lg ring-1 ring-black/5 focus:outline-none z-50 backdrop-blur-2xl',
            alignments[align],
            className
          )}
          id="dropdown-menu-list"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const DropdownItem = ({
  children,
  onClick,
  className,
  danger = false,
  id,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
  id?: string;
}) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownItem must be used within a Dropdown');
  const { setIsOpen } = context;

  const handleItemClick = () => {
    if (onClick) onClick();
    setIsOpen(false);
  };

  return (
    <button
      id={id}
      onClick={handleItemClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors select-none font-sans',
        danger 
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30' 
          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80',
        className
      )}
    >
      {children}
    </button>
  );
};

export const DropdownSeparator = () => (
  <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800/50" />
);
