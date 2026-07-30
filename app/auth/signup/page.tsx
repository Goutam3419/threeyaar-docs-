'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Bot, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { registerUser, loginWithGoogle } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign-up was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [errorName, setErrorName] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  // Guest-only route: already authenticated users go straight to the dashboard.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorName('');
    setErrorEmail('');
    setErrorPassword('');

    let hasError = false;
    
    if (!name) {
      setErrorName('Full Name is required');
      hasError = true;
    }

    if (!email) {
      setErrorEmail('Email is required');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorEmail('Please enter a valid email');
      hasError = true;
    }

    if (!password) {
      setErrorPassword('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setErrorPassword('Password must be at least 6 characters');
      hasError = true;
    }

    if (!acceptedTerms) {
      toast('Authorization Error', {
        description: 'You must accept the Terms of Service to continue.',
        type: 'warning',
      });
      return;
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      await registerUser({ name, email, password });
      toast('Verification Email Sent!', {
        description: `We sent a verification link to ${email}.`,
        type: 'success',
      });
      localStorage.setItem('temp_signup_email', email);
      localStorage.setItem('temp_signup_name', name);
      router.push('/auth/verify-email');
    } catch (err: any) {
      toast('Sign Up Failed', {
        description: friendlyAuthError(err?.code ?? ''),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast('Workspace Created!', { description: 'Signed up with Google successfully.', type: 'success' });
      router.push('/dashboard');
    } catch (err: any) {
      toast('Google Sign-Up Failed', {
        description: friendlyAuthError(err?.code ?? ''),
        type: 'error',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* Background Decorative */}
      <div className="absolute inset-0 registry-grid dark:registry-grid-dark pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] glow-orb-brass pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] glow-orb-pine pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group select-none" id="signup-brand">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brass-600 to-brass-700 flex items-center justify-center text-white shadow-md shadow-brass-500/25 group-hover:scale-105 transition-transform">
              <Bot className="h-5.5 w-5.5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              NexCart AI
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-sans">
            Deploy secure AI agents for your business in 60 seconds.
          </p>
        </div>

        <Card className="border border-zinc-200/80 dark:border-zinc-850 bg-white/85 dark:bg-zinc-900/65 backdrop-blur-md shadow-2xl" id="signup-card">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">Create Workspace</CardTitle>
            <CardDescription className="font-sans">Set up your business workspace and deploy free automated agents.</CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              className="w-full mb-4"
              type="button"
              isLoading={isGoogleLoading}
              onClick={handleGoogleSignup}
              id="signup-google-btn"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.6 34.8 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C39.9 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">or</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errorName}
                leftIcon={<User className="h-4 w-4" />}
                required
                id="signup-name-input"
              />

              <Input
                label="Work Email"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errorEmail}
                leftIcon={<Mail className="h-4 w-4" />}
                required
                id="signup-email-input"
              />

              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errorPassword}
                leftIcon={<Lock className="h-4 w-4" />}
                helperText="Must be at least 6 characters"
                required
                id="signup-password-input"
              />

              <div className="pt-1 select-none">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-brass-600 focus:ring-brass-500 h-3.5 w-3.5 shrink-0" 
                    id="accept-terms"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium font-sans leading-relaxed">
                    I accept the NexCart AI Terms of Service and Privacy Policy.
                  </span>
                </label>
              </div>

              <Button 
                variant="premium" 
                className="w-full mt-2" 
                type="submit" 
                isLoading={isLoading}
                id="signup-submit-btn"
              >
                Create Account <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-sans">
              Already have a NexCart AI workspace?{' '}
              <Link 
                href="/auth/login" 
                className="text-brass-600 hover:text-brass-500 dark:text-brass-400 dark:hover:text-brass-300 font-bold transition-colors"
                id="to-login-link"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Compliant banner */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-sans select-none">
          <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
          <span>AES-256 Encryption Active</span>
        </div>
      </motion.div>

    </div>
  );
}
