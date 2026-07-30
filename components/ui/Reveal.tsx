'use client';

import React from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** 'up' fades in while rising slightly; 'scale' fades in while scaling up from 96%. */
  variant?: 'up' | 'scale';
}

export function Reveal({ children, className, delay = 0, variant = 'up' }: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const initial = variant === 'scale' ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 24 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a list of children and staggers each Reveal-ed child's entrance. */
export function RevealGroup({
  children,
  className,
  staggerDelay = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * staggerDelay}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
