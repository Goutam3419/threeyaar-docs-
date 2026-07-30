'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Bot, Mail, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { sendPasswordResetEmail } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      // Intentionally vague — don't reveal whether an account exists.
      return "If an account exists for this email, we've sent reset instructions.";
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSent(true);
      toast('Reset Link Sent!', {
        description: `Check ${email} for a link to reset your password.`,
        type: 'success',
      });
    } catch (err: any) {
      // Firebase throws user-not-found for unregistered emails — we still
      // show a generic success-style message so we don't leak which emails
      // have accounts.
      if (err?.code === 'auth/user-not-found') {
        setSent(true);
        toast('Reset Link Sent!', {
          description: friendlyAuthError(err.code),
          type: 'success',
        });
      } else {
        toast('Request Failed', {
          description: friendlyAuthError(err?.code ?? ''),
          type: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* Background Decorative */}
      <div className="absolute inset-0 registry-grid dark:registry-grid-dark pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] glow-orb-brass pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] glow-orb-pine pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group select-none" id="forgot-brand">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brass-600 to-brass-700 flex items-center justify-center text-white shadow-md shadow-brass-500/25 group-hover:scale-105 transition-transform">
              <Bot className="h-5.5 w-5.5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              NexCart AI
            </span>
          </Link>
        </div>

        <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/85 dark:bg-zinc-900/65 backdrop-blur-md shadow-2xl" id="forgot-card">
          <CardHeader>
            <div className="h-12 w-12 rounded-full bg-brass-100 dark:bg-brass-950/40 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-200/30 dark:border-brass-900/30 mb-4 shadow-xs select-none">
              <HelpCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Reset Your Password</CardTitle>
            <CardDescription className="font-sans">Enter your email and we'll send you a link to reset your password.</CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Check your inbox at <span className="font-semibold text-zinc-900 dark:text-white">{email}</span> for the reset link.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <Input
                  label="Email"
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                  id="forgot-email-input"
                />

                <Button 
                  variant="premium" 
                  className="w-full mt-2" 
                  type="submit" 
                  isLoading={isLoading}
                  id="forgot-submit-btn"
                >
                  Send Reset Link <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans">
              Remembered your password?{' '}
              <Link 
                href="/auth/login" 
                className="text-brass-600 hover:text-brass-500 dark:text-brass-400 dark:hover:text-brass-300 font-bold transition-colors"
                id="forgot-to-login"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Security compliance banner */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-sans select-none">
          <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
          <span>AES-256 Encryption Active</span>
        </div>
      </motion.div>

    </div>
  );
}
