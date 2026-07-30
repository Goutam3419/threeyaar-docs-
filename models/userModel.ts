import type { User } from 'firebase/auth';
import { DEFAULT_USER_PROFILE_FIELDS, UserProfile } from '@/types/user';

/**
 * Builds a brand-new Firestore `users/{uid}` document for a user who has
 * just signed up. Called once, right after Firebase Auth account creation.
 */
export function buildNewUserProfile(
  firebaseUser: Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'>,
  overrides: Partial<Pick<UserProfile, 'company' | 'photoURL' | 'workspaceId'>> = {}
): UserProfile {
  const now = new Date().toISOString();
  const workspaceId = overrides.workspaceId ?? firebaseUser.uid; // 1 workspace per owner by default

  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    photoURL: overrides.photoURL ?? firebaseUser.photoURL ?? DEFAULT_USER_PROFILE_FIELDS.photoURL,
    role: DEFAULT_USER_PROFILE_FIELDS.role,
    company: overrides.company ?? DEFAULT_USER_PROFILE_FIELDS.company,
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
    subscription: DEFAULT_USER_PROFILE_FIELDS.subscription,
    workspaceId,
    status: DEFAULT_USER_PROFILE_FIELDS.status,
  };
}
