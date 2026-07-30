'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav className={cn('flex select-none', className)} aria-label="Breadcrumb" id="breadcrumb-nav">
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2.5">
        <li className="inline-flex items-center">
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-sans">
            <Home className="h-3 w-3 mr-1.5" />
            Core
          </span>
        </li>
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            <ChevronRight className="h-3.5 w-3.5 text-zinc-350 dark:text-zinc-600 mx-1 shrink-0" />
            {item.active || !item.href ? (
              <span
                className="text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 font-sans truncate max-w-[120px] sm:max-w-[200px]"
                aria-current="page"
                id={`breadcrumb-item-active-${index}`}
              >
                {item.label}
              </span>
            ) : (
              <span
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300 font-sans cursor-pointer transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                id={`breadcrumb-item-link-${index}`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
