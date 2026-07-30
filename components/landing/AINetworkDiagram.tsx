'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Github, Triangle, Chrome, ShoppingBag, FileText, CreditCard, Flame, Route, Sparkles, Bot, Brain } from 'lucide-react';

const NODES = [
  { label: 'GitHub', icon: Github, angle: -90 },
  { label: 'Vercel', icon: Triangle, angle: -60 },
  { label: 'Google', icon: Chrome, angle: -30 },
  { label: 'Shopify', icon: ShoppingBag, angle: 0 },
  { label: 'WordPress', icon: FileText, angle: 30 },
  { label: 'Stripe', icon: CreditCard, angle: 60 },
  { label: 'Firebase', icon: Flame, angle: 90 },
  { label: 'OpenRouter', icon: Route, angle: 120 },
  { label: 'Gemini', icon: Sparkles, angle: 150 },
  { label: 'OpenAI', icon: Bot, angle: 180 },
  { label: 'Anthropic', icon: Brain, angle: -150 },
];

const CENTER = { x: 300, y: 300 };
const RADIUS = 230;

function pointOnCircle(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER.x + RADIUS * Math.cos(rad), y: CENTER.y + RADIUS * Math.sin(rad) };
}

export function AINetworkDiagram() {
  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-square">
      <svg viewBox="0 0 600 600" className="w-full h-full">
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2478F5" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2478F5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2478F5" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#63AFFF" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <circle cx={CENTER.x} cy={CENTER.y} r={130} fill="url(#core-glow)" />

        {/* Connection lines */}
        {NODES.map((node, i) => {
          const p = pointOnCircle(node.angle);
          return (
            <motion.line
              key={node.label}
              x1={CENTER.x}
              y1={CENTER.y}
              x2={p.x}
              y2={p.y}
              stroke="url(#line-gradient)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.06 }}
              style={{ animation: `dash-flow 2.5s linear infinite` }}
            />
          );
        })}

        {/* Center node */}
        <circle cx={CENTER.x} cy={CENTER.y} r={44} fill="#0A0B0F" stroke="#2478F5" strokeWidth="2" />
      </svg>

      {/* Center label (HTML overlay, crisper text than SVG) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-[88px] w-[88px] rounded-full glass-elevated flex flex-col items-center justify-center shadow-glow-primary">
          <Bot className="h-6 w-6 text-brass-400 mb-0.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-300">Core</span>
        </div>
      </div>

      {/* Provider nodes (HTML overlay for crisp icons/labels) */}
      {NODES.map((node, i) => {
        const p = pointOnCircle(node.angle);
        const leftPct = (p.x / 600) * 100;
        const topPct = (p.y / 600) * 100;
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.06 }}
          >
            <div className="h-11 w-11 rounded-xl glass-panel flex items-center justify-center shadow-premium-sm">
              <Icon className="h-4.5 w-4.5 text-zinc-200" />
            </div>
            <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap font-sans">{node.label}</span>
          </motion.div>
        );
      })}

      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  );
}
