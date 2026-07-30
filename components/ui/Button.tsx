'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, onClick, ...props }, ref) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-medium rounded-xl overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';
    
    const variants = {
      primary: 'bg-brass-600 text-white hover:bg-brass-500 shadow-premium hover:shadow-glow-primary border border-transparent',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-white/[0.05] dark:text-zinc-50 dark:hover:bg-white/[0.09] border border-zinc-200/50 dark:border-white/8',
      outline: 'bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/[0.04]',
      ghost: 'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05]',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
      premium: 'text-white bg-[length:200%_auto] bg-gradient-to-r from-brass-600 via-brass-500 via-40% to-[#7C8CF8] hover:bg-[position:100%_0] shadow-glow-primary dark:shadow-premium',
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs gap-1.5',
      md: 'h-11 px-5 text-sm gap-2',
      lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl',
      icon: 'h-11 w-11 rounded-xl',
    };

    const prefersReducedMotion = usePrefersReducedMotion();
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const rippleId = useRef(0);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled && !isLoading && !prefersReducedMotion) {
          const rect = e.currentTarget.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height) * 2;
          const id = rippleId.current++;
          setRipples((prev) => [
            ...prev,
            { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
          ]);
          setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
        }
        onClick?.(e);
      },
      [disabled, isLoading, prefersReducedMotion, onClick]
    );

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        whileHover={disabled || isLoading || prefersReducedMotion ? undefined : { scale: 1.015 }}
        whileTap={disabled || isLoading || prefersReducedMotion ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        style={variant === 'premium' ? { transition: 'background-position 0.5s ease, box-shadow 0.2s ease' } : undefined}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {/* Ripple layer */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute rounded-full bg-white/35 pointer-events-none animate-[ripple_0.65s_ease-out]"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}

        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
