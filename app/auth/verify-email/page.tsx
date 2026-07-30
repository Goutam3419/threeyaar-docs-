'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Bot, Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/firebase';
import { resendVerification } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('temp_signup_email') || '';
    }
    return '';
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(59);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  // If there's no signed-in user at all (e.g. direct page visit), send them to signup.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signup');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckVerified = async () => {
    if (!auth.currentUser) return;
    setIsChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        toast('Email Verified!', {
          description: 'Your workspace has been provisioned successfully.',
          type: 'success',
        });
        router.push('/auth/welcome');
      } else {
        toast('Not Verified Yet', {
          description: "We haven't seen a click on the verification link yet. Check your inbox (and spam folder).",
          type: 'warning',
        });
      }
    } catch {
      toast('Something Went Wrong', { description: 'Please try again.', type: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !auth.currentUser) return;
    setIsResending(true);
    try {
      await resendVerification(auth.currentUser);
      setTimer(59);
      toast('Verification Email Sent', {
        description: `A new verification link has been sent to ${email}.`,
        type: 'info',
      });
    } catch {
      toast('Could Not Resend', { description: 'Please try again in a moment.', type: 'error' });
    } finally {
      setIsResending(false);
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
          <Link href="/" className="inline-flex items-center gap-2.5 group select-none" id="verify-brand">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brass-600 to-brass-700 flex items-center justify-center text-white shadow-md shadow-brass-500/25 group-hover:scale-105 transition-transform">
              <Bot className="h-5.5 w-5.5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              NexCart AI
            </span>
          </Link>
        </div>

        <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/85 dark:bg-zinc-900/65 backdrop-blur-md shadow-2xl" id="verify-card">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-brass-100 dark:bg-brass-950/40 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-200/30 dark:border-brass-900/30 mb-4 shadow-xs">
              <Mail className="h-6 w-6 animate-pulse" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Verify Your Email</CardTitle>
            <CardDescription className="font-sans">
              We sent a verification link to <span className="font-semibold text-zinc-900 dark:text-zinc-200">{email}</span>. Click it, then come back here.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button 
              variant="premium" 
              className="w-full mt-2" 
              type="button" 
              isLoading={isChecking}
              onClick={handleCheckVerified}
              id="verify-check-btn"
            >
              I've Verified My Email <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans text-center">
              Didn&apos;t receive the email?{' '}
              {timer > 0 ? (
                <span className="text-zinc-400">Resend in {timer}s</span>
              ) : (
                <button 
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-brass-600 hover:text-brass-500 dark:text-brass-400 dark:hover:text-brass-300 font-bold transition-all inline-flex items-center gap-1 focus:outline-none disabled:opacity-50"
                  id="resend-btn"
                >
                  <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} /> Resend Email
                </button>
              )}
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
