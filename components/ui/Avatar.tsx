'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glow?: boolean;
}

export const Avatar = ({
  src,
  alt = 'avatar',
  fallback = 'AI',
  size = 'md',
  glow = false,
  className,
  ...props
}: AvatarProps) => {
  const [error, setError] = useState(false);

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl font-semibold',
    '2xl': 'h-32 w-32 text-3xl font-bold',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 select-none font-display font-medium text-zinc-600 dark:text-zinc-300',
        sizes[size],
        glow && 'ring-2 ring-brass-500 ring-offset-2 dark:ring-offset-zinc-950 shadow-lg shadow-brass-500/20',
        className
      )}
      {...props}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={alt}
          fill
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover h-full w-full"
          onError={() => setError(true)}
        />
      ) : (
        <span>{getInitials(fallback)}</span>
      )}
    </div>
  );
};
