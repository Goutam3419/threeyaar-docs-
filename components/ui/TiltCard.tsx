'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** How far the card tilts, in degrees. Keep modest — this is premium, not gimmicky. */
  maxTilt?: number;
  /** How far the card visually lifts toward the cursor (magnetic pull), in px. */
  magneticStrength?: number;
  id?: string;
}

/**
 * Wraps any card content with mouse-driven 3D tilt, a subtle magnetic pull
 * toward the cursor, and a moving glass "reflection" highlight. Falls back
 * to a plain static wrapper when the person prefers reduced motion or is on
 * a touch device (tilt has no meaning without a hover position).
 */
export function TiltCard({ children, className, maxTilt = 8, magneticStrength = 6, id }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isTouch] = useState(() => typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 220, damping: 22, mass: 0.4 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);
  const translateX = useSpring(useTransform(x, [-0.5, 0.5], [-magneticStrength, magneticStrength]), springConfig);
  const translateY = useSpring(useTransform(y, [-0.5, 0.5], [-magneticStrength, magneticStrength]), springConfig);
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.14), transparent 60%)`;

  const disabled = prefersReducedMotion || isTouch;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (disabled) {
    return (
      <div className={cn('relative', className)} id={id}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, x: translateX, y: translateY, transformPerspective: 900 }}
      className={cn('relative will-change-transform', className)}
    >
      {children}
      {/* Glass reflection highlight that follows the cursor */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: glareBackground }}
      />
    </motion.div>
  );
}
