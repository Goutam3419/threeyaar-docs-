'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Bot, Lock, ArrowRight, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { checkResetCode, resetPassword } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/expired-action-code':
      return 'This reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has already been used.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const oobCode = searchParams.get('oobCode');

  const [checkingCode, setCheckingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errorPassword, setErrorPassword] = useState('');
  const [errorConfirm, setErrorConfirm] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setCheckingCode(false);
      setCodeValid(false);
      return;
    }
    checkResetCode(oobCode)
      .then((email) => {
        setAccountEmail(email);
        setCodeValid(true);
      })
      .catch(() => {
        setCodeValid(false);
      })
      .finally(() => setCheckingCode(false));
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPassword('');
    setErrorConfirm('');

    let hasError = false;

    if (!password) {
      setErrorPassword('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setErrorPassword('Password must be at least 6 characters');
      hasError = true;
    }

    if (password !== confirmPassword) {
      setErrorConfirm('Passwords do not match');
      hasError = true;
    }

    if (hasError || !oobCode) return;

    setIsLoading(true);
    try {
      await resetPassword(oobCode, password);
      toast('Password Reset Complete!', {
        description: 'Your password has been updated. Please sign in.',
        type: 'success',
      });
      router.push('/auth/login');
    } catch (err: any) {
      toast('Reset Failed', {
        description: friendlyAuthError(err?.code ?? ''),
        type: 'error',
      });
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
          <Link href="/" className="inline-flex items-center gap-2.5 group select-none" id="reset-brand">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brass-600 to-brass-700 flex items-center justify-center text-white shadow-md shadow-brass-500/25 group-hover:scale-105 transition-transform">
              <Bot className="h-5.5 w-5.5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              NexCart AI
            </span>
          </Link>
        </div>

        <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/85 dark:bg-zinc-900/65 backdrop-blur-md shadow-2xl" id="reset-card">
          {checkingCode ? (
            <CardContent className="py-10 flex flex-col items-center gap-3">
              <Loader size="lg" />
              <p className="text-xs text-zinc-500">Verifying your reset link...</p>
            </CardContent>
          ) : !codeValid ? (
            <>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200/30 dark:border-red-900/30 mb-4 shadow-xs select-none">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Invalid or Expired Link</CardTitle>
                <CardDescription className="font-sans">This password reset link is invalid or has expired. Please request a new one.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/auth/forgot-password" className="w-full">
                  <Button variant="premium" className="w-full">Request New Link</Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-brass-100 dark:bg-brass-950/40 text-brass-600 dark:text-brass-400 flex items-center justify-center border border-brass-200/30 dark:border-brass-900/30 mb-4 shadow-xs select-none">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Set a New Password</CardTitle>
                <CardDescription className="font-sans">Choose a new password for <span className="font-semibold text-zinc-900 dark:text-zinc-200">{accountEmail}</span>.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleReset} className="space-y-4">
                  <Input
                    label="New Password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errorPassword}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                    id="reset-password-input"
                  />

                  <Input
                    label="Confirm New Password"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errorConfirm}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                    id="reset-confirm-password-input"
                  />

                  <Button 
                    variant="premium" 
                    className="w-full mt-2" 
                    type="submit" 
                    isLoading={isLoading}
                    id="reset-submit-btn"
                  >
                    Update Password <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex-col gap-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans">
                  Cancel and return to{' '}
                  <Link 
                    href="/auth/login" 
                    className="text-brass-600 hover:text-brass-500 dark:text-brass-400 dark:hover:text-brass-300 font-bold transition-colors"
                    id="reset-to-login"
                  >
                    Sign In
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader size="lg" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
