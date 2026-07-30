'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  animateIn?: boolean;
  delay?: number;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, animateIn = false, delay = 0, ...props }, ref) => {
    const classNames = cn(
      'rounded-2xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl p-6 shadow-premium-sm dark:border-white/8 dark:bg-white/[0.035] dark:backdrop-blur-2xl transition-all duration-300',
      hoverEffect && 'hover:border-zinc-300 dark:hover:border-white/16 hover:shadow-premium dark:hover:bg-white/[0.05] hover:-translate-y-0.5',
      className
    );

    if (animateIn) {
      return (
        <motion.div
          ref={ref as any}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay, ease: 'easeOut' }}
          className={classNames}
          {...(props as any)}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={classNames}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50', className)} {...props} />
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/50 mt-4', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';
