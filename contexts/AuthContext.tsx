'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { initAuthPersistence, subscribeToAuthChanges } from '@/lib/firebase/auth';
import { subscribeToUserProfile, touchLastLogin } from '@/lib/firebase/firestore';
import { ensureUserProfileExists } from '@/services/authService';
import type { UserProfile } from '@/types/user';

interface AuthContextType {
  /** Raw Firebase Auth user, or null if signed out. */
  user: User | null;
  /** Live Firestore `users/{uid}` document for the signed-in user. */
  profile: UserProfile | null;
  /** True while the initial auth state is still being resolved. */
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasTouchedLoginRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    initAuthPersistence().catch(() => {
      // Non-fatal — persistence just falls back to the SDK default.
    });

    const unsubscribeAuth = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Make sure a Firestore profile exists (covers Google sign-in first time,
      // or any account created before the profile doc was written).
      try {
        await ensureUserProfileExists(firebaseUser);
      } catch {
        // If this fails (e.g. offline), the live subscription below will
        // simply report `null` until connectivity is restored.
      }

      if (hasTouchedLoginRef.current !== firebaseUser.uid) {
        hasTouchedLoginRef.current = firebaseUser.uid;
        touchLastLogin(firebaseUser.uid).catch(() => {});
      }

      unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, (liveProfile) => {
        setProfile(liveProfile);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
