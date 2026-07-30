'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Check, Rocket, Network, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';

type OnboardingStep = 'initialize' | 'scope' | 'deploy' | 'complete';

export default function WelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { profile } = useAuth();
  const [name, setName] = useState('there');

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('temp_signup_name');
      if (stored) setName(stored);
    }
  }, [profile]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('initialize');
  const [initPercent, setInitPercent] = useState(0);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Step 1: Workspace setup progress
  useEffect(() => {
    if (currentStep === 'initialize') {
      const interval = setInterval(() => {
        setInitPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setCurrentStep('scope');
              toast('Workspace Ready!', {
                description: 'Your account has been set up successfully.',
                type: 'success',
              });
            }, 600);
            return 100;
          }
          return prev + 5;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [currentStep, toast]);

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) => 
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleNextScope = () => {
    if (selectedScopes.length === 0) {
      toast('Selection needed', {
        description: 'Please select at least one business tool to continue, or skip for now.',
        type: 'warning',
      });
      return;
    }
    setCurrentStep('deploy');
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setCurrentStep('complete');
      toast('Workspace Ready!', {
        description: 'Your workspace has been set up successfully.',
        type: 'success',
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* Background Decorative */}
      <div className="absolute inset-0 registry-grid dark:registry-grid-dark pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] glow-orb-brass pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] glow-orb-pine pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10 select-none"
      >
        {/* Progress header */}
        <div className="flex items-center justify-between px-2 mb-6 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-sans">
          <span className={currentStep === 'initialize' ? 'text-brass-600 dark:text-brass-400' : ''}>1. Setup</span>
          <span className={currentStep === 'scope' ? 'text-brass-600 dark:text-brass-400' : ''}>2. Connections</span>
          <span className={currentStep === 'deploy' ? 'text-brass-600 dark:text-brass-400' : ''}>3. Workspace</span>
          <span className={currentStep === 'complete' ? 'text-brass-600 dark:text-brass-400' : ''}>4. Ready</span>
        </div>

        <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/85 dark:bg-zinc-900/65 backdrop-blur-md shadow-2xl overflow-hidden" id="welcome-card">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Setting up account */}
            {currentStep === 'initialize' && (
              <motion.div
                key="step-initialize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 text-center"
              >
                <div className="h-16 w-16 bg-brass-500/10 dark:bg-brass-500/10 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-500/20 rounded-2xl mx-auto mb-6 shadow-sm">
                  <Rocket className="h-8 w-8 animate-pulse" />
                </div>
                <CardTitle className="text-2xl font-bold font-display">Setting Up Your Workspace...</CardTitle>
                <CardDescription className="font-sans mt-2">
                  Welcome, <span className="font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>. We're getting your business workspace ready.
                </CardDescription>

                <div className="mt-8 space-y-2">
                  <Progress value={initPercent} showValueLabel />
                  <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 pt-1">
                    Setting up your workspace... {initPercent}%
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Connect business tools */}
            {currentStep === 'scope' && (
              <motion.div
                key="step-scope"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <div className="text-center mb-6">
                  <div className="h-14 w-14 bg-brass-600/10 dark:bg-brass-600/10 text-brass-700 dark:text-brass-500 flex items-center justify-center border border-brass-600/20 rounded-2xl mx-auto mb-4 shadow-sm">
                    <Network className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-display">Connect Your Business Tools</CardTitle>
                  <CardDescription className="font-sans">
                    Choose the tools your agents can connect to. You can add or remove these anytime from Connections.
                  </CardDescription>
                </div>

                <div className="space-y-3 font-sans">
                  {[
                    { id: 'shopify', label: 'Shopify / E-commerce', desc: 'Let agents manage orders, refunds, and customer queries.' },
                    { id: 'email', label: 'Email & Calendar', desc: 'Let agents draft replies and schedule meetings on your behalf.' },
                    { id: 'accounting', label: 'Accounting Software', desc: 'Let agents help reconcile transactions and prepare reports.' },
                  ].map((scope) => {
                    const isSelected = selectedScopes.includes(scope.id);
                    return (
                      <div
                        key={scope.id}
                        onClick={() => toggleScope(scope.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none ${isSelected ? 'border-brass-500 bg-brass-500/5 dark:bg-brass-500/5' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                        id={`scope-selector-${scope.id}`}
                      >
                        <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brass-600 border-transparent text-white' : 'border-zinc-350 dark:border-zinc-700 bg-white dark:bg-zinc-900'}`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{scope.label}</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">{scope.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button variant="premium" className="w-full mt-6" onClick={handleNextScope} id="scope-next-btn">
                  Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </motion.div>
            )}

            {/* Step 3: Finish workspace setup */}
            {currentStep === 'deploy' && (
              <motion.div
                key="step-deploy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 text-center"
              >
                <div className="h-16 w-16 bg-brass-400/10 dark:bg-brass-400/10 text-brass-500 dark:text-brass-300 flex items-center justify-center border border-brass-400/20 rounded-2xl mx-auto mb-6 shadow-sm">
                  <Bot className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold font-display">Finish Setting Up</CardTitle>
                <CardDescription className="font-sans mt-2">
                  Your workspace is almost ready. You can browse the marketplace and deploy your first agent right after this.
                </CardDescription>

                {isDeploying ? (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <Loader size="lg" />
                    <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                      Setting up your workspace...
                    </p>
                  </div>
                ) : (
                  <Button variant="premium" className="w-full mt-8" onClick={handleDeploy} id="deploy-fleet-btn">
                    Finish Setup
                  </Button>
                )}
              </motion.div>
            )}

            {/* Step 4: Finished! */}
            {currentStep === 'complete' && (
              <motion.div
                key="step-complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 text-center"
              >
                <div className="h-16 w-16 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 rounded-2xl mx-auto mb-6 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 animate-bounce" />
                </div>
                <CardTitle className="text-2xl font-bold font-display">Your Workspace Is Ready</CardTitle>
                <CardDescription className="font-sans mt-2">
                  Welcome, {name}! Your workspace has been set up. Head to the marketplace to deploy your first agent.
                </CardDescription>

                <Link href="/dashboard" id="onboarding-to-dashboard">
                  <Button variant="premium" size="lg" className="w-full mt-8">
                    Go to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </Card>
      </motion.div>

    </div>
  );
}
