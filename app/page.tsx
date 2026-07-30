'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { 
  Bot, Sparkles, ArrowRight, ShieldCheck, Zap, Lock,
  Layers, Users, Star, HelpCircle, ChevronRight, 
  Check, Sun, Moon, Laptop, Globe, Scale, Building2, Boxes, PlugZap, LineChart as LineChartIcon
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { EmptyState } from '@/components/ui/EmptyState';
import { TiltCard } from '@/components/ui/TiltCard';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';
import { CATEGORIES, POPULAR_AGENTS, TESTIMONIALS, PRICING_PLANS, FAQS } from '@/data/mockData';
import { FloatingAgentCards } from '@/components/landing/FloatingAgentCards';
import { AINetworkDiagram } from '@/components/landing/AINetworkDiagram';
import { CountUp } from '@/components/landing/CountUp';

const NAV_SECTIONS = ['hero', 'features', 'popular', 'integrations', 'analytics', 'pricing', 'testimonials', 'faq'];

// The 3D hero is client-only (WebGL) and fairly heavy, so it's lazy-loaded
// and excluded from the server bundle entirely — this is the "lazy load 3D"
// / performance requirement.
const Hero3DClient = dynamic(() => import('@/components/landing/Hero3D'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center"><div className="h-32 w-32 rounded-full glow-orb-brass blur-2xl animate-pulse" /></div>,
});

export default function LandingPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('All Agents');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically reduce 3D fidelity on small screens or when the person
  // prefers reduced motion — "never break layout, reduce effects" requirement.
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallScreen = window.innerWidth < 768;
    setIsReducedMotion(prefersReduced || isSmallScreen);
  }, []);

  // --- Header: hide on scroll-down, reveal on scroll-up ---
  const { scrollY } = useScroll();
  const [headerHidden, setHeaderHidden] = useState(false);
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHeaderHidden(latest > previous && latest > 120);
  });

  // --- Active section indicator ---
  const [activeSection, setActiveSection] = useState('hero');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    NAV_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleCTA = () => {
    toast('Welcome to NexCart AI Platform!', {
      description: 'Redirecting you to the premium signup suite.',
      type: 'success',
    });
  };

  const filteredAgents = activeCategory === 'All Agents'
    ? POPULAR_AGENTS
    : POPULAR_AGENTS.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decorative Grids and Glow Orbs */}
      <div className="absolute inset-0 registry-grid dark:registry-grid-dark pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] glow-orb-brass pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] glow-orb-pine pointer-events-none z-0" />

      {/* --- HEADER NAVIGATION --- */}
      <ScrollProgressBar />
      <motion.header
        animate={{ y: headerHidden ? '-100%' : '0%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none group" id="header-logo">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brass-500 to-brass-700 flex items-center justify-center text-white shadow-glow-primary group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              NexCart AI
            </span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-600 border border-zinc-300/60 dark:border-zinc-700/60 rounded px-1.5 py-0.5 -translate-y-3">
              OS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 select-none font-sans text-sm font-medium">
            {[
              { id: 'features', label: 'Features' },
              { id: 'popular', label: 'Agents' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'testimonials', label: 'Case Studies' },
              { id: 'faq', label: 'FAQ' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`relative transition-colors py-1 ${activeSection === item.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-brass-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Right Controls (Theme, Auth Buttons) */}
          <div className="hidden md:flex items-center gap-4 select-none">
            {/* Theme Selector */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/40 dark:border-zinc-850">
              <button 
                onClick={() => setTheme('light')} 
                className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-450 hover:text-zinc-900 dark:hover:text-white'}`}
                title="Light Theme"
                id="theme-btn-light"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-zinc-800 text-zinc-50 shadow-xs' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                title="Dark Theme"
                id="theme-btn-dark"
              >
                <Moon className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setTheme('system')} 
                className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-450 hover:text-zinc-900 dark:hover:text-white'}`}
                title="System Theme"
                id="theme-btn-system"
              >
                <Laptop className="h-4 w-4" />
              </button>
            </div>

            <Link href="/auth/login" id="header-login-btn">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup" id="header-signup-btn">
              <Button variant="premium" size="sm" onClick={handleCTA}>Deploy Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Mobile Theme toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500"
              id="mobile-theme-toggle"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
              id="mobile-menu-btn"
            >
              <Bot className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-30 p-6 flex flex-col gap-4 shadow-xl"
            id="mobile-navigation-panel"
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Features</a>
            <a href="#popular" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Agents</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Case Studies</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">FAQ</a>
            <hr className="border-zinc-100 dark:border-zinc-800" />
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} id="mobile-login-btn">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} id="mobile-signup-btn">
                <Button variant="premium" className="w-full">Deploy Free</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION (3D AI Core) --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 text-center select-none overflow-visible" id="hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brass-600 dark:text-brass-400" id="hero-announcement">
            <span className="h-1.5 w-1.5 rounded-full bg-pine-500 animate-pulse" />
            NexCart AI OS — Live
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight max-w-5xl leading-[1.08] text-zinc-900 dark:text-white">
            The <span className="text-gradient-dark">AI Operating System</span> for Modern Businesses
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl font-sans leading-relaxed">
            Discover, connect, and deploy AI agents to handle customer support, marketing, bookkeeping, and sales for your business.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link href="/auth/signup" id="hero-get-started-btn">
              <Button variant="premium" size="lg" className="w-full sm:w-auto">
                Get Started <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* --- 3D AI Core + floating agent cards --- */}
          <div className="relative w-full h-[420px] sm:h-[520px] lg:h-[600px] mt-14 mb-4">
            <div className="absolute inset-0 glow-orb-brass rounded-full blur-3xl opacity-60 pointer-events-none" />
            <Hero3DClient reduced={isReducedMotion} />
            <FloatingAgentCards />
          </div>

          {/* Value props — no fabricated statistics, just what the platform offers */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-300/50 dark:divide-zinc-800 border-y border-zinc-300/50 dark:border-zinc-800 max-w-4xl w-full">
            <div className="px-4 py-5 sm:px-8">
              <p className="font-mono font-tabular text-lg sm:text-xl font-medium text-zinc-900 dark:text-white">Verified</p>
              <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-1 font-mono">Agents only</p>
            </div>
            <div className="px-4 py-5 sm:px-8">
              <p className="font-mono font-tabular text-lg sm:text-xl font-medium text-zinc-900 dark:text-white">No Contracts</p>
              <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-1 font-mono">Cancel anytime</p>
            </div>
            <div className="px-4 py-5 sm:px-8">
              <p className="font-mono font-tabular text-lg sm:text-xl font-medium text-zinc-900 dark:text-white">Secure</p>
              <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-1 font-mono">By default</p>
            </div>
            <div className="px-4 py-5 sm:px-8">
              <p className="font-mono font-tabular text-lg sm:text-xl font-medium text-zinc-900 dark:text-white">Human</p>
              <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-1 font-mono">Support included</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- AI OPERATING SYSTEM SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="features">
        <div className="text-center mb-16 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="features-badge">Why NexCart AI</Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Built for reliable, secure automation
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-sans">
            Every agent on NexCart AI runs securely, deploys quickly, and keeps your business data protected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Reveal delay={0}>
          <TiltCard>
          <Card hoverEffect className="flex flex-col gap-2 p-8" id="feat-card-1">
            <div className="h-12 w-12 rounded-xl bg-brass-500/10 dark:bg-brass-500/10 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-500/20 mb-4 shadow-sm shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Verified Agents</CardTitle>
            <CardDescription className="leading-relaxed font-sans mt-2">
              Every agent listed on the marketplace is reviewed before it goes live, so you know exactly what you're deploying.
            </CardDescription>
          </Card>
          </TiltCard>
          </Reveal>

          <Reveal delay={0.1}>
          <TiltCard>
          <Card hoverEffect className="flex flex-col gap-2 p-8" id="feat-card-2">
            <div className="h-12 w-12 rounded-xl bg-brass-400/10 dark:bg-brass-400/10 text-brass-500 dark:text-brass-300 flex items-center justify-center border border-brass-400/20 mb-4 shadow-sm shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <CardTitle>Fast Setup</CardTitle>
            <CardDescription className="leading-relaxed font-sans mt-2">
              Connect your business tools and deploy your first agent in minutes — no technical setup required.
            </CardDescription>
          </Card>
          </TiltCard>
          </Reveal>

          <Reveal delay={0.2}>
          <TiltCard>
          <Card hoverEffect className="flex flex-col gap-2 p-8" id="feat-card-3">
            <div className="h-12 w-12 rounded-xl bg-brass-600/10 dark:bg-brass-600/10 text-brass-700 dark:text-brass-500 flex items-center justify-center border border-brass-600/20 mb-4 shadow-sm shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle>Secure by Default</CardTitle>
            <CardDescription className="leading-relaxed font-sans mt-2">
              Your business data and connected accounts stay protected with strong encryption at every step.
            </CardDescription>
          </Card>
          </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* --- WHY CHOOSE US SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 border-t border-zinc-200/40 dark:border-zinc-800/40" id="why-choose-us">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="select-none">
            <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="wcu-badge">How It Works</Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Full visibility over your automated workforce.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
              Unlike generic chatbot tools, NexCart AI lets you see exactly what each agent is doing, connect it safely to your business tools, and stay in control at every step.
            </p>

            <ul className="mt-8 space-y-4 font-sans text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Grant or revoke each agent's access to your tools anytime.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Transparent, usage-based billing you can track anytime.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Clear activity logs so you always know what happened.</span>
              </li>
            </ul>
          </div>

          <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-900 p-8 flex flex-col justify-center gap-8 select-none">
            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-brass-500/10 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-500/20 shrink-0 font-mono text-xs font-bold">1</div>
              <div>
                <h4 className="font-display font-semibold text-zinc-900 dark:text-white text-sm">Connect your tools</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Securely link the business tools you already use.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-brass-500/10 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-500/20 shrink-0 font-mono text-xs font-bold">2</div>
              <div>
                <h4 className="font-display font-semibold text-zinc-900 dark:text-white text-sm">Choose an agent</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Pick a verified agent that matches the task you need done.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-brass-500/10 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-500/20 shrink-0 font-mono text-xs font-bold">3</div>
              <div>
                <h4 className="font-display font-semibold text-zinc-900 dark:text-white text-sm">Deploy and monitor</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Turn it on, then track its activity from your dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- POPULAR AI AGENTS & CATEGORIES --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="popular">
        <div className="text-center mb-12 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="marketplace-badge">Marketplace Hub</Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Discover Active Intelligence
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-sans">
            Filter through our curated catalog of support agents, marketing specialists, bookkeepers, and sales operators.
          </p>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth mask-image max-w-5xl mx-auto border-b border-zinc-150 dark:border-zinc-800/50">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                toast(`Category Selected`, { description: `Filtering by ${cat}`, type: 'info' });
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all select-none font-sans ${activeCategory === cat ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
              id={`cat-filter-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Grid */}
        {filteredAgents.length === 0 ? (
          <EmptyState
            title="No Agents Available Yet"
            description="New agents will appear here as they're added to the marketplace."
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex"
              >
                <TiltCard maxTilt={6} className="w-full h-full flex">
                <Card hoverEffect className="flex flex-col justify-between w-full h-full relative !rounded-lg" id={`agent-card-${agent.id}`}>
                  <div>
                    <div className="flex items-start justify-between mb-4 select-none">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 rounded-md overflow-hidden bg-zinc-900 dark:bg-brass-500 flex items-center justify-center shrink-0">
                          <Bot className="h-5 w-5 text-brass-400 dark:text-zinc-950" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">{agent.name}</h3>
                          <p className="text-[11px] font-mono text-zinc-450 dark:text-zinc-500">by {agent.developer}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 pt-1">
                        AGT-{String(agent.id).padStart(3, '0')}
                      </span>
                    </div>
                    {agent.badge && (
                      <Badge variant="premium" className="mb-3">{agent.badge}</Badge>
                    )}
                    <CardDescription className="leading-relaxed font-sans text-sm">
                      {agent.description}
                    </CardDescription>
                  </div>

                  <div className="mt-6 font-mono text-xs">
                    <div className="flex items-center justify-between py-2 border-t border-zinc-150 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                      <span className="uppercase tracking-wide text-[10px] text-zinc-400 dark:text-zinc-600">Rating</span>
                      <span className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200">
                        <Star className="h-3 w-3 fill-brass-400 text-brass-400" /> {agent.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-zinc-150 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                      <span className="uppercase tracking-wide text-[10px] text-zinc-400 dark:text-zinc-600">Active deploys</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{agent.users}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-150 dark:border-zinc-800/60">
                      <span className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-50">{agent.price}</span>
                      <Link href="/auth/signup" id={`deploy-btn-agent-${agent.id}`}>
                        <Button variant="secondary" size="sm" className="!font-sans">Deploy</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        )}
      </section>

      {/* --- INTEGRATIONS SECTION (AI Network) --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="integrations">
        <div className="text-center mb-12 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="integrations-badge">Ecosystem</Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            One core. Every tool you already use.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-sans">
            NexCart AI connects to the platforms your business runs on — development, commerce, content, payments, and AI models — through one secure core.
          </p>
        </div>

        <AINetworkDiagram />
      </section>

      {/* --- ANALYTICS SECTION (Stats) --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="analytics">
        <div className="text-center mb-12 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="analytics-badge">Platform Analytics</Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Built to scale with your business.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto text-center">
          <div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-brass-500"><CountUp end={23} suffix="+" /></p>
            <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-2 font-mono">Integrations</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-brass-500"><CountUp end={99.9} decimals={1} suffix="%" /></p>
            <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-2 font-mono">Uptime target</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-brass-500"><CountUp end={5} suffix="min" /></p>
            <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-2 font-mono">Avg. setup time</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-brass-500"><CountUp end={256} suffix="-bit" /></p>
            <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-2 font-mono">Encryption</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-brass-500"><CountUp end={24} suffix="/7" /></p>
            <p className="text-[11px] font-medium tracking-wider text-zinc-450 dark:text-zinc-500 uppercase mt-2 font-mono">Human support</p>
          </div>
        </div>
        <p className="text-center text-[11px] text-zinc-450 dark:text-zinc-600 mt-8 font-mono">
          Platform capabilities shown above — live workspace usage stats appear in your dashboard.
        </p>
      </section>

      {/* --- PRICING PREVIEW --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="pricing">
        <div className="text-center mb-16 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="pricing-badge">Pricing Plans</Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Simple, Scale-Safe Pricing
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-sans">
            No long-term contracts. Scale your automated workforce securely and pay only for what you use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan, planIdx) => (
            <Reveal key={plan.id} delay={planIdx * 0.08}>
            <TiltCard maxTilt={5}>
            <Card 
              className={`flex flex-col justify-between p-8 relative ${plan.popular ? 'border-brass-500 shadow-lg shadow-brass-500/10 dark:shadow-brass-950/20' : ''}`}
              id={`price-card-${plan.id}`}
            >
              {plan.popular && (
                <Badge variant="premium" className="absolute top-4 right-4">Most Popular</Badge>
              )}
              <div>
                <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                <div className="mt-4 flex items-baseline select-none">
                  <span className="font-display text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
                    {plan.priceAmount === null ? 'Contact for pricing' : `${plan.currency ?? ''}${plan.priceAmount}`}
                  </span>
                  {plan.priceAmount !== null && plan.billingPeriod !== 'custom' && (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-1 font-sans">/mo</span>
                  )}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-550 dark:text-zinc-400 font-sans">{plan.description}</p>
                
                <ul className="mt-6 space-y-3 font-sans text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link href="/auth/signup" id={`price-cta-btn-${plan.id}`}>
                  <Button variant={plan.popular ? 'premium' : 'outline'} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </Card>
            </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="testimonials">
        <div className="text-center mb-16 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="testimonials-badge">Validation</Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Trusted by business owners
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-sans">
            Reviews from business owners will appear here as they share their experience.
          </p>
        </div>

        {TESTIMONIALS.length === 0 ? (
          <EmptyState
            title="No Reviews Yet"
            description="Customer reviews will appear here as businesses share their experience."
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((test) => (
            <Card key={test.id} className="flex flex-col justify-between p-8" id={`testimonial-card-${test.id}`}>
              <p className="text-sm sm:text-base text-zinc-650 dark:text-zinc-300 font-sans italic leading-relaxed">
                &ldquo;{test.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3.5 mt-6 select-none border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
                <div className="h-10 w-10 rounded-full bg-zinc-100 overflow-hidden relative border border-zinc-200/30">
                  <Image src={test.avatar} alt={test.author} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{test.author}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">{test.role} at {test.company}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        )}
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 sm:py-28 border-t border-zinc-200/40 dark:border-zinc-800/40" id="faq">
        <div className="text-center mb-12 select-none">
          <Badge variant="outline" className="mb-3 font-semibold text-brass-600 dark:text-brass-400" id="faq-badge">Faq Help</Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white animate-fade-in">
            Platform FAQs
          </h2>
        </div>

        <Accordion 
          items={FAQS.map(faq => ({
            id: faq.id,
            trigger: faq.question,
            content: faq.answer
          }))}
        />
      </section>

      {/* --- FINAL CTA --- */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28" id="final-cta">
        <div className="relative rounded-3xl overflow-hidden glass-elevated shadow-premium-lg px-8 py-16 sm:py-24 text-center">
          <div className="absolute inset-0 glow-orb-brass opacity-70 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 glow-orb-pine rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-6 select-none">
              <div className="h-11 w-11 rounded-xl bg-brass-500/15 border border-brass-500/25 flex items-center justify-center"><Building2 className="h-5 w-5 text-brass-400" /></div>
              <div className="h-11 w-11 rounded-xl bg-brass-500/15 border border-brass-500/25 flex items-center justify-center"><Boxes className="h-5 w-5 text-brass-400" /></div>
              <div className="h-11 w-11 rounded-xl bg-brass-500/15 border border-brass-500/25 flex items-center justify-center"><PlugZap className="h-5 w-5 text-brass-400" /></div>
              <div className="h-11 w-11 rounded-xl bg-brass-500/15 border border-brass-500/25 flex items-center justify-center"><LineChartIcon className="h-5 w-5 text-brass-400" /></div>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-3xl">
              Run your business with an AI workforce, starting today.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-xl font-sans">
              Join NexCart AI and deploy your first agent in minutes — no credit card required to get started.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/auth/signup" id="final-cta-signup-btn">
                <Button variant="premium" size="lg" className="w-full sm:w-auto">
                  Get Started Free <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/auth/login" id="final-cta-login-btn">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2" id="footer-logo">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brass-600 to-brass-700 flex items-center justify-center text-white shadow-sm shadow-brass-500/20">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="font-display text-lg font-bold text-zinc-900 dark:text-white">
                  NexCart AI
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
                Autonomous AI agents for business owners — built for security, reliability, and fast setup.
              </p>
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs sm:text-sm">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider text-xs">Resources</h4>
              <a href="#features" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Platform Features</a>
              <a href="#popular" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Marketplace Hub</a>
              <a href="#pricing" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Pricing Plans</a>
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs sm:text-sm">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider text-xs">Security</h4>
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Data Encryption</span>
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-500" /> Secure Integrations</span>
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"><Scale className="h-4 w-4 text-emerald-500" /> License auditing</span>
            </div>

            <div className="flex flex-col gap-3 font-sans text-xs sm:text-sm">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider text-xs">Legal</h4>
              <span className="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white">Security Compliance</span>
              <span className="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white">Privacy Safeguard</span>
              <span className="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white">Platform SLA</span>
            </div>

          </div>

          <hr className="my-10 border-zinc-150 dark:border-zinc-900" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            <p>&copy; {new Date().getFullYear()} NexCart AI Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200">System Status: <span className="text-emerald-500 font-semibold">Online</span></span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
