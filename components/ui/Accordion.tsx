'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  id: string;
  trigger: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion = ({ items, allowMultiple = false, className }: AccordionProps) => {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) => 
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn('w-full flex flex-col gap-3', className)} id="accordion-container">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        
        return (
          <div
            key={item.id}
            className="border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white dark:bg-zinc-900/30 overflow-hidden backdrop-blur-sm transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
            id={`accordion-item-${item.id}`}
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-brass-600 dark:hover:text-brass-400 transition-colors focus:outline-none select-none font-display"
              id={`accordion-trigger-${item.id}`}
            >
              <span>{item.trigger}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-zinc-400 shrink-0"
              >
                <ChevronDown className="h-4.5 w-4.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 font-sans border-t border-zinc-100/50 dark:border-zinc-800/40 mt-1">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
