'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Globe2, Bot, TrendingUp, Video, Megaphone, LineChart, Headphones, BarChart3 } from 'lucide-react';

const AGENTS = [
  { label: 'Website Builder', icon: Globe2, angle: -100 },
  { label: 'AI CEO', icon: Bot, angle: -55 },
  { label: 'SEO Agent', icon: TrendingUp, angle: -15 },
  { label: 'Video Agent', icon: Video, angle: 25 },
  { label: 'Marketing Agent', icon: Megaphone, angle: 65 },
  { label: 'Sales Agent', icon: LineChart, angle: 105 },
  { label: 'Support Agent', icon: Headphones, angle: 150 },
  { label: 'Analytics Agent', icon: BarChart3, angle: -140 },
];

/**
 * Positions each card on an ellipse around the center using basic trig.
 * Hidden below `lg` — on small screens the 3D core alone is the hero visual,
 * per the "never break layout on mobile" requirement.
 */
export function FloatingAgentCards() {
  return (
    <div className="hidden lg:block absolute inset-0 pointer-events-none select-none" aria-hidden="true">
      {AGENTS.map((agent, i) => {
        const rad = (agent.angle * Math.PI) / 180;
        const radiusX = 44; // % of container width
        const radiusY = 38; // % of container height
        const left = 50 + radiusX * Math.cos(rad);
        const top = 50 + radiusY * Math.sin(rad);
        const Icon = agent.icon;

        return (
          <motion.div
            key={agent.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -10, 0],
            }}
            transition={{
              opacity: { duration: 0.6, delay: 0.3 + i * 0.08 },
              scale: { duration: 0.6, delay: 0.3 + i * 0.08 },
              y: { duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
            }}
            whileHover={{ scale: 1.08, y: -4 }}
          >
            <div className="glass-elevated rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-premium">
              <div className="h-8 w-8 rounded-lg bg-brass-500/15 border border-brass-500/25 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-brass-400" />
              </div>
              <span className="text-xs font-semibold text-white whitespace-nowrap font-sans">{agent.label}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
