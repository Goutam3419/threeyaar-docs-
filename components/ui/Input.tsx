'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const fallbackId = React.useId();
    const uniqueId = id || fallbackId;
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={uniqueId} 
            className="text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={uniqueId}
            ref={ref}
            type={type}
            className={cn(
              'w-full h-11 px-3.5 rounded-xl border text-sm transition-all focus-visible:outline-none bg-white dark:bg-white/[0.03] text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500',
              error 
                ? 'border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20' 
                : 'border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-brass-500 focus-visible:ring-2 focus-visible:ring-brass-500/10 dark:focus-visible:border-brass-500/80',
              leftIcon && 'pl-10.5',
              rightIcon && 'pr-10.5',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-zinc-400 dark:text-zinc-500 select-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const fallbackId = React.useId();
    const uniqueId = id || fallbackId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={uniqueId} 
            className="text-xs font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400 select-none"
          >
            {label}
          </label>
        )}
        <textarea
          id={uniqueId}
          ref={ref}
          className={cn(
            'w-full min-h-[100px] px-3.5 py-2.5 rounded-xl border text-sm transition-all focus-visible:outline-none bg-white dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none',
            error 
              ? 'border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20' 
              : 'border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-brass-500 focus-visible:ring-2 focus-visible:ring-brass-500/10 dark:focus-visible:border-brass-500/80',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
