'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) => {
  const getPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      className={cn('flex items-center justify-between py-4 select-none', className)}
      id="pagination"
    >
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          id="pagination-mobile-prev"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          id="pagination-mobile-next"
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Showing page <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentPage}</span> of{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200/30 dark:border-zinc-800/30 gap-1" aria-label="Pagination">
            <button
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center p-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              id="pagination-prev"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPages().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'relative inline-flex items-center px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors select-none font-sans',
                  page === currentPage
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                    : 'text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/30'
                )}
                id={`pagination-page-${page}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center p-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              id="pagination-next"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
